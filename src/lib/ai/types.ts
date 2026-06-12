// Tipos da avaliação multiagente — espelham o JSON estruturado da especificação.

export interface PatientContext {
  userId: string;
  name: string;
  age: number | null;
  sex: string | null;
  heightCm: number | null;
  weightKg: number | null;
  targetWeightKg: number | null;
  imc: number | null;
  bodyFatPct: number | null;
  goalType: string | null;
  goalDescription: string | null;
  goalDeadline: string | null;
  motivation: string | null;
  medicalConditions: string[];
  injuries: string | null;
  allergies: string | null;
  dietaryRestrictions: string | null;
  sleepHours: number | null;
  stressLevel: string | null;
  activityLevel: string | null;
  experienceLevel: string | null;
  trainingFrequency: number | null;
  availableEquipment: string[];
  availableTimes: string | null;
  limitations: string | null;
  currentDiet: Record<string, string | null>;
  medications: { name: string; dosage: string | null; frequency: string | null }[];
  examFindings: string | null;
  measurements: Record<string, number | null>;
  previousMeasurements: Record<string, number | null> | null;
  bodyScanSummary: string | null;
  tdee: number | null;
  targetCalories: number | null;
  waterGoalMl: number;
}

export interface AgentSection {
  analysis: string;
  recommendations: string[];
  warnings?: string[];
}

export interface NutritionSection extends AgentSection {
  strategy: string;
  meal_plan: {
    breakfast: string[];
    lunch: string[];
    dinner: string[];
    snacks: string[];
  };
  calories_estimate?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
}

export interface TrainerSection extends AgentSection {
  weekly_plan: WorkoutDay[];
  progression: string;
}

export interface WorkoutDay {
  day: string;
  name: string;
  goal: string;
  duration: string;
  warmup: string;
  exercises: { name: string; sets: number; reps: string; rest: number; load?: string }[];
}

export interface BodyVisionSection {
  analysis: string;
  estimated_measurements: Record<string, number | string>;
  body_composition_estimate: Record<string, number | string>;
  posture_analysis: Record<string, string>;
  confidence_level: string;
  margin_of_error: string;
  recommendations: string[];
}

export interface DailyMobilePlan {
  today_summary: string;
  workout_today: { title: string; description: string }[];
  meals_today: { meal_type: "cafe" | "almoco" | "jantar" | "lanche"; title: string; description: string }[];
  water_goal_ml: number;
  medication_reminders: string[];
  daily_checklist: string[];
}

export interface AgentMessage {
  agent: "supervisor" | "medico_esporte" | "nutricionista" | "treinador" | "body_vision";
  message: string;
}

export interface SafetyValidation {
  is_safe: boolean;
  warnings: string[];
  requires_professional_followup: boolean;
  reason: string;
}

export interface IntegratedPlanSection {
  next_30_days: string;
  monthly_goals: string[];
  habits: string[];
  metrics_to_track: string[];
  next_checkin: string;
}

// JSON final — formato exigido na especificação
export interface AssessmentResult {
  summary: string;
  current_condition: string;
  main_goal: string;
  risk_alerts: string[];
  doctor_sport: AgentSection;
  nutritionist: NutritionSection;
  trainer: TrainerSection;
  body_vision: BodyVisionSection;
  daily_mobile_plan: DailyMobilePlan;
  agent_discussion: AgentMessage[];
  integrated_plan: IntegratedPlanSection;
  safety_validation: SafetyValidation;
  confidence_score: number;
  is_mock: boolean;
}
