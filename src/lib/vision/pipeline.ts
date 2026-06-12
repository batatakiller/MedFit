// ════════════════════════════════════════════════════════════════════════
// Pipeline híbrido de análise corporal por imagem — MVP
//
// 1. Upload e validação de qualidade das fotos (frente/costas/perfis)
// 2. Segmentação corporal       → MediaPipe (máscara de segmentação)
// 3. Detecção de pose/landmarks → MediaPipe Pose Landmarker (client-side)
// 4. Referência de escala       → altura informada pelo paciente
// 5. Estimativa de composição   → heurísticas geométricas sobre landmarks
// 6. Reconstrução 3D avançada   → estrutura futura (SMPL/SMPL-X) em smpl.ts
// 7. Comparação mensal          → compareScans()
// 8. Interpretação por IA       → Body Vision Agent (lib/ai)
//
// IMPORTANTE: todos os valores são ESTIMATIVAS com margem de erro — não
// substituem bioimpedância, adipometria, DEXA ou avaliação presencial.
// ════════════════════════════════════════════════════════════════════════

export type ScanAngle = "frente" | "lado_esquerdo" | "lado_direito" | "costas";

export interface NormalizedLandmark {
  x: number; // 0..1 (largura da imagem)
  y: number; // 0..1 (altura da imagem)
  z?: number;
  visibility?: number;
}

export interface AnglePhotoResult {
  angle: ScanAngle;
  filePath: string; // path no bucket privado body-photos
  qualityScore: number; // 0..1
  landmarks: NormalizedLandmark[] | null;
  imageWidth: number;
  imageHeight: number;
}

export interface ScanEstimates {
  shoulderWidthCm: number | null;
  waistCm: number | null;
  hipCm: number | null;
  chestCm: number | null;
  neckCm: number | null;
  armCm: number | null;
  thighCm: number | null;
  bodyFatPct: number | null;
  postureNotes: string[];
  confidence: number; // 0..1
  marginOfError: string;
}

// Índices dos landmarks do MediaPipe Pose (BlazePose GHUM, 33 pontos)
export const LM = {
  NOSE: 0, L_EAR: 7, R_EAR: 8,
  L_SHOULDER: 11, R_SHOULDER: 12,
  L_ELBOW: 13, R_ELBOW: 14,
  L_WRIST: 15, R_WRIST: 16,
  L_HIP: 23, R_HIP: 24,
  L_KNEE: 25, R_KNEE: 26,
  L_ANKLE: 27, R_ANKLE: 28,
  L_HEEL: 29, R_HEEL: 30,
} as const;

// ── 1. Validação de qualidade ────────────────────────────────────────────
export function validatePhotoQuality(opts: {
  landmarks: NormalizedLandmark[] | null;
  imageWidth: number;
  imageHeight: number;
}): { ok: boolean; score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 1;

  if (opts.imageWidth < 480 || opts.imageHeight < 640) {
    issues.push("Resolução baixa — aproxime a câmera ou use resolução maior");
    score -= 0.3;
  }
  if (!opts.landmarks || opts.landmarks.length < 33) {
    issues.push("Corpo não detectado por inteiro — afaste a câmera e enquadre dos pés à cabeça");
    return { ok: false, score: 0.2, issues };
  }
  const lm = opts.landmarks;
  const head = lm[LM.NOSE], lAnkle = lm[LM.L_ANKLE], rAnkle = lm[LM.R_ANKLE];
  if (head.y > 0.25) {
    issues.push("Cabeça muito baixa no enquadramento — centralize o corpo");
    score -= 0.15;
  }
  if (Math.min(lAnkle.y, rAnkle.y) < 0.7) {
    issues.push("Pés não visíveis na base — enquadre o corpo inteiro");
    score -= 0.2;
  }
  const lowVisibility = lm.filter((p) => (p.visibility ?? 1) < 0.5).length;
  if (lowVisibility > 8) {
    issues.push("Vários pontos do corpo com baixa visibilidade — melhore a iluminação e use fundo neutro");
    score -= 0.25;
  }
  score = Math.max(0, Math.min(1, score));
  return { ok: score >= 0.5, score, issues };
}

// ── 4+5. Escala pela altura + estimativas geométricas ────────────────────
// Distância em px entre topo (nariz~cabeça) e calcanhar define a escala cm/px.
export function estimateFromLandmarks(opts: {
  front: AnglePhotoResult | null;
  side: AnglePhotoResult | null;
  heightCm: number;
  weightKg: number | null;
  age: number | null;
  sex: string | null;
}): ScanEstimates {
  const notes: string[] = [];
  const f = opts.front;
  if (!f?.landmarks) {
    return {
      shoulderWidthCm: null, waistCm: null, hipCm: null, chestCm: null,
      neckCm: null, armCm: null, thighCm: null,
      bodyFatPct: deurenbergBodyFat(opts),
      postureNotes: ["Sem landmarks frontais — estimativas limitadas."],
      confidence: 0.3,
      marginOfError: "indeterminada (fotos insuficientes)",
    };
  }
  const lm = f.landmarks;
  const px = (a: NormalizedLandmark, b: NormalizedLandmark) =>
    Math.hypot((a.x - b.x) * f.imageWidth, (a.y - b.y) * f.imageHeight);

  // escala: cabeça→calcanhar ≈ 93% da estatura (nariz fica ~7% abaixo do topo)
  const heel = lm[LM.L_HEEL].y > lm[LM.R_HEEL].y ? lm[LM.L_HEEL] : lm[LM.R_HEEL];
  const bodyPx = px(lm[LM.NOSE], heel);
  const cmPerPx = (opts.heightCm * 0.93) / Math.max(bodyPx, 1);

  const shoulderPx = px(lm[LM.L_SHOULDER], lm[LM.R_SHOULDER]);
  const hipPx = px(lm[LM.L_HIP], lm[LM.R_HIP]);
  const shoulderWidthCm = round1(shoulderPx * cmPerPx);

  // larguras 2D → circunferências aproximadas por modelo elíptico
  // (profundidade estimada pelo perfil quando disponível; senão razão típica)
  const sidePx = opts.side?.landmarks
    ? sideDepthPx(opts.side)
    : null;
  const depthRatio = sidePx && opts.side
    ? (sidePx * ((opts.heightCm * 0.93) / Math.max(
        Math.hypot(
          (opts.side.landmarks![LM.NOSE].x - opts.side.landmarks![LM.L_HEEL].x) * opts.side.imageWidth,
          (opts.side.landmarks![LM.NOSE].y - opts.side.landmarks![LM.L_HEEL].y) * opts.side.imageHeight
        ), 1))) / Math.max(hipPx * cmPerPx, 1)
    : 0.72; // razão profundidade/largura típica

  const ellipse = (widthCm: number, ratio = depthRatio) => {
    const a = widthCm / 2;
    const b = (widthCm * ratio) / 2;
    // perímetro de elipse (Ramanujan)
    return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
  };

  const hipWidthCm = hipPx * cmPerPx * 1.18; // landmarks de quadril são internos à silhueta
  const waistWidthCm = hipWidthCm * 0.92;
  const chestWidthCm = shoulderWidthCm * 0.82;

  const waistCm = round1(ellipse(waistWidthCm));
  const hipCm = round1(ellipse(hipWidthCm, depthRatio * 1.05));
  const chestCm = round1(ellipse(chestWidthCm, depthRatio * 0.95));
  const neckCm = round1(chestCm * 0.36);
  const armPx = px(lm[LM.L_SHOULDER], lm[LM.L_ELBOW]);
  const armCm = round1(armPx * cmPerPx * 0.92);
  const thighPx = px(lm[LM.L_HIP], lm[LM.L_KNEE]);
  const thighCm = round1(thighPx * cmPerPx * 1.25);

  // postura: assimetrias simples nos landmarks frontais
  const shoulderTilt = Math.abs(lm[LM.L_SHOULDER].y - lm[LM.R_SHOULDER].y) * f.imageHeight * cmPerPx;
  if (shoulderTilt > 2.5) notes.push(`Possível desnível de ombros (~${round1(shoulderTilt)}cm) — observar em avaliação presencial`);
  const hipTilt = Math.abs(lm[LM.L_HIP].y - lm[LM.R_HIP].y) * f.imageHeight * cmPerPx;
  if (hipTilt > 2) notes.push(`Possível inclinação pélvica (~${round1(hipTilt)}cm)`);
  if (!notes.length) notes.push("Sem assimetrias relevantes detectadas nos landmarks (estimativa)");

  const quality = (f.qualityScore + (opts.side?.qualityScore ?? f.qualityScore)) / 2;
  const confidence = Math.min(0.85, 0.45 + quality * 0.35 + (opts.side ? 0.05 : 0));

  return {
    shoulderWidthCm, waistCm, hipCm, chestCm, neckCm, armCm, thighCm,
    bodyFatPct: bodyFatFromGeometry({ waistCm, neckCm, hipCm, ...opts }) ?? deurenbergBodyFat(opts),
    postureNotes: notes,
    confidence: round2(confidence),
    marginOfError: "±2-4cm nas circunferências; ±3-5% no percentual de gordura",
  };
}

function sideDepthPx(side: AnglePhotoResult): number | null {
  const lm = side.landmarks;
  if (!lm) return null;
  // profundidade do tronco aproximada: distância horizontal ombro→quadril no perfil
  const d = Math.abs(lm[LM.L_SHOULDER].x - lm[LM.L_HIP].x) * side.imageWidth;
  return d > 0 ? d * 2.2 : null;
}

// US Navy (circunferências) — estimativa, não medição clínica
function bodyFatFromGeometry(o: {
  waistCm: number | null; neckCm: number | null; hipCm: number | null;
  heightCm: number; sex: string | null;
}): number | null {
  if (!o.waistCm || !o.neckCm) return null;
  try {
    if (o.sex === "feminino") {
      if (!o.hipCm) return null;
      return round1(
        495 / (1.29579 - 0.35004 * Math.log10(o.waistCm + o.hipCm - o.neckCm) + 0.221 * Math.log10(o.heightCm)) - 450
      );
    }
    return round1(
      495 / (1.0324 - 0.19077 * Math.log10(o.waistCm - o.neckCm) + 0.15456 * Math.log10(o.heightCm)) - 450
    );
  } catch {
    return null;
  }
}

function deurenbergBodyFat(o: { weightKg: number | null; heightCm: number; age: number | null; sex: string | null }) {
  if (!o.weightKg || !o.age) return null;
  const imc = o.weightKg / Math.pow(o.heightCm / 100, 2);
  const sexFactor = o.sex === "feminino" ? 0 : 1;
  return round1(1.2 * imc + 0.23 * o.age - 10.8 * sexFactor - 5.4);
}

// ── 7. Comparação mensal ─────────────────────────────────────────────────
export function compareScans(
  current: Partial<ScanEstimates> & { weightKg?: number | null },
  previous: Partial<ScanEstimates> & { weightKg?: number | null }
) {
  const deltas: { metric: string; delta: number; unit: string }[] = [];
  const add = (metric: string, c?: number | null, p?: number | null, unit = "cm") => {
    if (c != null && p != null) deltas.push({ metric, delta: round1(c - p), unit });
  };
  add("Peso", current.weightKg, previous.weightKg, "kg");
  add("Cintura", current.waistCm, previous.waistCm);
  add("Quadril", current.hipCm, previous.hipCm);
  add("Tórax", current.chestCm, previous.chestCm);
  add("Braço", current.armCm, previous.armCm);
  add("Coxa", current.thighCm, previous.thighCm);
  add("Gordura corporal", current.bodyFatPct, previous.bodyFatPct, "%");
  return deltas;
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;
