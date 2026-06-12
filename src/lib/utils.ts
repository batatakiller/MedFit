import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(d?: string | Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

// Mensagem fixa exigida na área de medicamentos
export const MEDICATION_DISCLAIMER =
  "O Med Fit não prescreve, altera ou suspende medicamentos. Siga sempre a orientação do seu médico.";

export const SAFETY_STOP_WARNING =
  "Interrompa o treino imediatamente e procure atendimento em caso de dor no peito, tontura, falta de ar intensa, dor aguda ou mal-estar.";

export const NOT_MEDICAL_ADVICE =
  "O Med Fit é uma ferramenta de apoio educacional, estratégico e preventivo. Não substitui consulta médica, diagnóstico, prescrição, nutricionista ou treinador presencial.";
