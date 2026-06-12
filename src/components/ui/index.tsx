import { cn } from "@/lib/utils";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { MEDICATION_DISCLAIMER, NOT_MEDICAL_ADVICE } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("card p-5", className)}>{children}</div>;
}

export function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-bold text-ink dark:text-white">{title}</h2>
        {subtitle && <p className="text-sm text-ink-soft dark:text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink dark:text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-ink-soft dark:text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function StatCard({ label, value, hint, accent }: { label: string; value: React.ReactNode; hint?: string; accent?: "brand" | "tech" | "amber" | "rose" }) {
  const accents = {
    brand: "text-brand-600",
    tech: "text-tech-600",
    amber: "text-amber-600",
    rose: "text-rose-600",
  };
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-mute">{label}</p>
      <p className={cn("mt-1 text-2xl font-extrabold", accents[accent ?? "brand"])}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-soft dark:text-slate-400">{hint}</p>}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-3 p-10 text-center">
      <p className="font-semibold text-ink dark:text-white">{title}</p>
      {description && <p className="max-w-md text-sm text-ink-soft dark:text-slate-400">{description}</p>}
      {action}
    </div>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800", className)}>
      <div
        className="h-full rounded-full bg-brand-gradient transition-all"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

// Aviso fixo de medicamentos (exigência da especificação)
export function MedicationDisclaimer() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="font-medium">{MEDICATION_DISCLAIMER}</p>
    </div>
  );
}

// SafetyWarningCard — alertas de segurança/validação profissional
export function SafetyWarningCard({ warnings, title }: { warnings: string[]; title?: string }) {
  if (!warnings.length) return null;
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/50 dark:bg-rose-950/30">
      <div className="flex items-center gap-2 font-semibold text-rose-800 dark:text-rose-300">
        <AlertTriangle className="h-5 w-5" />
        {title ?? "Alertas importantes"}
      </div>
      <ul className="mt-2 space-y-1.5 text-sm text-rose-800/90 dark:text-rose-200/90">
        {warnings.map((w, i) => (
          <li key={i} className="flex gap-2">
            <span className="select-none">•</span>
            {w}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EducationalNotice({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs leading-relaxed text-ink-mute", className)}>{NOT_MEDICAL_ADVICE}</p>
  );
}

// ConfidenceScoreBadge — nível de confiança das análises por IA/imagem
export function ConfidenceScoreBadge({ score, marginOfError }: { score?: number | null; marginOfError?: string | null }) {
  if (score == null) return null;
  const pct = Math.round(score * 100);
  const tone =
    pct >= 75 ? "bg-brand-100 text-brand-800" : pct >= 50 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800";
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className={cn("chip", tone)}>Confiança: {pct}%</span>
      {marginOfError && <span className="chip bg-slate-100 text-slate-600">Margem de erro: {marginOfError}</span>}
    </span>
  );
}
