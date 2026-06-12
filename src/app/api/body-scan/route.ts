import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  compareScans, estimateFromLandmarks, validatePhotoQuality,
  type AnglePhotoResult, type ScanAngle,
} from "@/lib/vision/pipeline";

export const dynamic = "force-dynamic";

const photoSchema = z.object({
  angle: z.enum(["frente", "lado_esquerdo", "lado_direito", "costas"]),
  filePath: z.string().min(3).max(500),
  imageWidth: z.number().int().min(100).max(10000),
  imageHeight: z.number().int().min(100).max(10000),
  landmarks: z
    .array(z.object({
      x: z.number(), y: z.number(),
      z: z.number().optional(), visibility: z.number().optional(),
    }))
    .nullable(),
});

const bodySchema = z.object({
  photos: z.array(photoSchema).min(1).max(4),
  weightKg: z.number().min(30).max(400).nullable(),
});

// POST /api/body-scan — processa o pipeline (validação → escala → estimativas)
// e grava sessão, fotos, medidas estimadas e relatório técnico.
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "não autenticado" }, { status: 401 });

  // consentimento específico para análise corporal por fotos
  const { data: consent } = await supabase
    .from("consents")
    .select("id")
    .eq("user_id", user.id)
    .eq("consent_type", "fotos_corporais")
    .eq("accepted", true)
    .limit(1)
    .maybeSingle();
  if (!consent) {
    return NextResponse.json({ error: "consentimento de fotos corporais necessário" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "dados inválidos" }, { status: 400 });
  }
  const { photos, weightKg } = parsed.data;

  const { data: profile } = await supabase
    .from("profiles")
    .select("height, age, sex, birth_date")
    .eq("user_id", user.id)
    .single();
  if (!profile?.height) {
    return NextResponse.json({ error: "informe sua altura no perfil (referência de escala)" }, { status: 400 });
  }

  // 1) validação de qualidade por foto
  const results: AnglePhotoResult[] = photos.map((p) => {
    const q = validatePhotoQuality({
      landmarks: p.landmarks,
      imageWidth: p.imageWidth,
      imageHeight: p.imageHeight,
    });
    return {
      angle: p.angle as ScanAngle,
      filePath: p.filePath,
      qualityScore: q.score,
      landmarks: p.landmarks,
      imageWidth: p.imageWidth,
      imageHeight: p.imageHeight,
    };
  });

  const front = results.find((r) => r.angle === "frente") ?? null;
  const side = results.find((r) => r.angle.startsWith("lado")) ?? null;
  const allLowQuality = results.every((r) => r.qualityScore < 0.5);

  // 2) estimativas (escala = altura informada)
  const est = estimateFromLandmarks({
    front, side,
    heightCm: Number(profile.height),
    weightKg,
    age: profile.age,
    sex: profile.sex,
  });

  // 3) comparação com o scan anterior (evolução mensal)
  const { data: prevSession } = await supabase
    .from("body_scan_sessions")
    .select("scan_date, weight_at_scan, body_fat_estimate, body_scan_measurements(waist_estimate, hip_estimate, chest_estimate, arm_estimate, thigh_estimate)")
    .eq("user_id", user.id)
    .eq("status", "concluido")
    .order("scan_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const prevMeas = Array.isArray(prevSession?.body_scan_measurements)
    ? prevSession?.body_scan_measurements[0]
    : null;
  const comparison = prevSession
    ? compareScans(
        {
          weightKg: weightKg,
          waistCm: est.waistCm, hipCm: est.hipCm, chestCm: est.chestCm,
          armCm: est.armCm, thighCm: est.thighCm, bodyFatPct: est.bodyFatPct,
        },
        {
          weightKg: prevSession.weight_at_scan ? Number(prevSession.weight_at_scan) : null,
          waistCm: prevMeas?.waist_estimate ? Number(prevMeas.waist_estimate) : null,
          hipCm: prevMeas?.hip_estimate ? Number(prevMeas.hip_estimate) : null,
          chestCm: prevMeas?.chest_estimate ? Number(prevMeas.chest_estimate) : null,
          armCm: prevMeas?.arm_estimate ? Number(prevMeas.arm_estimate) : null,
          thighCm: prevMeas?.thigh_estimate ? Number(prevMeas.thigh_estimate) : null,
          bodyFatPct: prevSession.body_fat_estimate ? Number(prevSession.body_fat_estimate) : null,
        }
      )
    : [];

  // 4) persistência
  const { data: session, error } = await supabase
    .from("body_scan_sessions")
    .insert({
      user_id: user.id,
      height_reference: profile.height,
      weight_at_scan: weightKg,
      confidence_score: est.confidence,
      body_fat_estimate: est.bodyFatPct,
      margin_of_error: est.marginOfError,
      status: allLowQuality ? "rejeitado" : "concluido",
      notes: allLowQuality
        ? "Qualidade insuficiente — refaça as fotos seguindo o guia."
        : null,
    })
    .select("id")
    .single();
  if (error || !session) {
    return NextResponse.json({ error: "falha ao salvar scan" }, { status: 500 });
  }

  await supabase.from("body_scan_photos").insert(
    results.map((r) => ({
      user_id: user.id,
      scan_session_id: session.id,
      angle: r.angle,
      file_url: r.filePath,
      quality_score: r.qualityScore,
      landmarks: r.landmarks,
    }))
  );

  if (!allLowQuality) {
    await supabase.from("body_scan_measurements").insert({
      user_id: user.id,
      scan_session_id: session.id,
      waist_estimate: est.waistCm,
      hip_estimate: est.hipCm,
      chest_estimate: est.chestCm,
      abdomen_estimate: est.waistCm, // proxy no MVP (refinado na versão 3D)
      arm_estimate: est.armCm,
      thigh_estimate: est.thighCm,
      neck_estimate: est.neckCm,
      shoulder_width_estimate: est.shoulderWidthCm,
      margin_of_error: est.marginOfError,
    });
    await supabase.from("body_scan_reports").insert({
      user_id: user.id,
      scan_session_id: session.id,
      posture_analysis: { notas: est.postureNotes },
      body_composition_analysis: {
        gordura_corporal_pct: est.bodyFatPct,
        confianca: est.confidence,
        margem_erro: est.marginOfError,
        metodo: "MediaPipe Pose + escala por altura + modelo elíptico (estimativa)",
      },
      visual_progress_analysis: comparison.length
        ? { vs_scan_de: prevSession?.scan_date, deltas: comparison }
        : null,
      recommendations: [
        "Valores são estimativas — para precisão use bioimpedância, adipometria ou DEXA",
        "Refaça fotos mensalmente nas mesmas condições (roupa, pose, distância, luz)",
      ],
    });
  }

  return NextResponse.json({
    ok: !allLowQuality,
    scanId: session.id,
    status: allLowQuality ? "rejeitado" : "concluido",
    estimates: allLowQuality ? null : est,
    comparison: allLowQuality ? null : { since: prevSession?.scan_date ?? null, deltas: comparison },
  });
}
