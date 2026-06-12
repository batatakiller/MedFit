// MealPlanCard — plano alimentar completo com substituições
import { Card } from "@/components/ui";

export interface MealPlanRow {
  title: string;
  calories_estimate: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  water_goal_ml: number | null;
  breakfast: unknown;
  lunch: unknown;
  dinner: unknown;
  snacks: unknown;
  notes: string | null;
  created_at: string;
}

const toList = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(String) : typeof v === "string" && v ? [v] : [];

const SUBSTITUTIONS: [string, string][] = [
  ["Arroz integral", "batata-doce, mandioca ou quinoa"],
  ["Frango grelhado", "peixe, ovos ou patinho moído"],
  ["Iogurte natural", "coalhada ou kefir"],
  ["Pão integral", "tapioca ou cuscuz"],
  ["Castanhas", "amendoim sem sal ou pasta de amendoim"],
];

export function MealPlanCard({ plan }: { plan: MealPlanRow }) {
  const meals: [string, string, string[]][] = [
    ["☕", "Café da manhã", toList(plan.breakfast)],
    ["🍽️", "Almoço", toList(plan.lunch)],
    ["🍎", "Lanches", toList(plan.snacks)],
    ["🌙", "Jantar", toList(plan.dinner)],
  ];
  return (
    <div className="space-y-4">
      <Card>
        <h3 className="font-bold">{plan.title}</h3>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {plan.calories_estimate && <span className="chip bg-brand-100 text-brand-800">~{plan.calories_estimate} kcal/dia</span>}
          {plan.protein && <span className="chip bg-tech-100 text-tech-800">Proteína {plan.protein}g</span>}
          {plan.carbs && <span className="chip bg-amber-100 text-amber-800">Carbo {plan.carbs}g</span>}
          {plan.fats && <span className="chip bg-purple-100 text-purple-800">Gordura {plan.fats}g</span>}
          {plan.water_goal_ml && <span className="chip bg-sky-100 text-sky-800">Água {(plan.water_goal_ml / 1000).toFixed(1)}L</span>}
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {meals.map(([emoji, title, items]) => (
          <Card key={title}>
            <p className="font-bold">{emoji} {title}</p>
            <ul className="mt-2 space-y-1.5 text-sm text-ink-soft dark:text-slate-300">
              {items.length ? items.map((it, i) => <li key={i}>• {it}</li>) : <li>—</li>}
            </ul>
          </Card>
        ))}
      </div>

      <Card>
        <p className="font-bold">🔄 Substituições sugeridas</p>
        <ul className="mt-2 space-y-1.5 text-sm text-ink-soft dark:text-slate-300">
          {SUBSTITUTIONS.map(([from, to]) => (
            <li key={from}><b>{from}</b> → {to}</li>
          ))}
        </ul>
      </Card>

      {plan.notes && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{plan.notes}</p>
      )}
    </div>
  );
}
