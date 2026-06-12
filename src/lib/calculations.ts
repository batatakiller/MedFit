// Cálculos de saúde — valores educacionais/estimativas, nunca diagnóstico.

export function calcIMC(weightKg?: number | null, heightCm?: number | null) {
  if (!weightKg || !heightCm) return null;
  const h = heightCm / 100;
  return Math.round((weightKg / (h * h)) * 10) / 10;
}

export function imcCategory(imc: number | null) {
  if (imc == null) return "—";
  if (imc < 18.5) return "Abaixo do peso";
  if (imc < 25) return "Peso adequado";
  if (imc < 30) return "Sobrepeso";
  if (imc < 35) return "Obesidade grau 1";
  if (imc < 40) return "Obesidade grau 2";
  return "Obesidade grau 3";
}

const ACTIVITY_FACTOR: Record<string, number> = {
  sedentario: 1.2,
  leve: 1.375,
  moderado: 1.55,
  muito_ativo: 1.725,
  atleta: 1.9,
};

// Mifflin-St Jeor — taxa metabólica basal (estimativa)
export function calcBMR(opts: {
  weightKg?: number | null;
  heightCm?: number | null;
  age?: number | null;
  sex?: string | null;
}) {
  const { weightKg, heightCm, age, sex } = opts;
  if (!weightKg || !heightCm || !age) return null;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === "feminino" ? base - 161 : base + 5);
}

// Gasto calórico diário estimado (TDEE)
export function calcTDEE(bmr: number | null, activityLevel?: string | null) {
  if (!bmr) return null;
  return Math.round(bmr * (ACTIVITY_FACTOR[activityLevel ?? "sedentario"] ?? 1.2));
}

// Necessidade calórica conforme objetivo (déficit/superávit moderados e seguros)
export function calcTargetCalories(tdee: number | null, goalType?: string | null) {
  if (!tdee) return null;
  switch (goalType) {
    case "emagrecimento":
    case "reducao_gordura_abdominal":
    case "saude_metabolica":
      return tdee - 500;
    case "definicao":
      return tdee - 300;
    case "ganho_massa":
      return tdee + 300;
    case "recomposicao":
    case "fisico_atletico":
      return tdee + 100;
    default:
      return tdee;
  }
}

// Macros estimados: proteína 1,8g/kg, gordura 25% kcal, resto carboidrato
export function calcMacros(calories: number | null, weightKg?: number | null) {
  if (!calories || !weightKg) return null;
  const protein = Math.round(weightKg * 1.8);
  const fats = Math.round((calories * 0.25) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fats * 9) / 4));
  return { protein, carbs, fats };
}

// Meta de água: 35ml/kg, mínimo 2L
export function calcWaterGoalMl(weightKg?: number | null) {
  if (!weightKg) return 2000;
  return Math.max(2000, Math.round((weightKg * 35) / 100) * 100);
}

export function ageFromBirthDate(birthDate?: string | null) {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}
