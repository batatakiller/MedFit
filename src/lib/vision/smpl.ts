// ════════════════════════════════════════════════════════════════════════
// Reconstrução corporal 3D — VERSÃO AVANÇADA (estrutura futura)
//
// Plano: usar SMPL / SMPL-X / SMPLify-X para ajustar uma malha corporal 3D
// paramétrica às fotos do paciente, e DensePose para mapear pixels → superfície.
// A malha permite medir circunferências reais (cintura, quadril, tórax, braço,
// coxa, pescoço) e comparar a forma 3D entre avaliações.
//
// Arquitetura prevista:
//   fotos → segmentação → keypoints 2D (MediaPipe/OpenPose)
//        → otimização SMPLify-X (betas de forma + pose)            [serviço Python/GPU]
//        → malha 3D → medição de circunferências por plano de corte
//        → diff de malha entre sessões (evolução volumétrica)
//
// Este módulo define o CONTRATO que o serviço externo deverá cumprir; o app
// já está pronto para consumir os resultados quando o serviço existir.
// ════════════════════════════════════════════════════════════════════════

export interface Smpl3DRequest {
  scanSessionId: string;
  heightCm: number;
  photos: { angle: string; signedUrl: string }[];
}

export interface Smpl3DMeasurements {
  waistCm: number;
  hipCm: number;
  chestCm: number;
  armCm: number;
  thighCm: number;
  neckCm: number;
  bodyVolumeL: number;
  betas: number[]; // parâmetros de forma SMPL
  confidence: number;
  marginOfError: string;
}

export interface Smpl3DResult {
  ok: boolean;
  measurements?: Smpl3DMeasurements;
  meshUrl?: string; // .obj/.glb da malha aproximada
  error?: string;
}

const SMPL_SERVICE_URL = process.env.MEDFIT_SMPL_SERVICE_URL;

export function smpl3dAvailable() {
  return Boolean(SMPL_SERVICE_URL);
}

export async function requestSmpl3DReconstruction(req: Smpl3DRequest): Promise<Smpl3DResult> {
  if (!SMPL_SERVICE_URL) {
    return { ok: false, error: "Reconstrução 3D ainda não habilitada (MEDFIT_SMPL_SERVICE_URL)" };
  }
  const res = await fetch(SMPL_SERVICE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) return { ok: false, error: `serviço 3D retornou ${res.status}` };
  return (await res.json()) as Smpl3DResult;
}
