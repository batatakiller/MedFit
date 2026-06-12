import { Camera, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui";

const instructions = [
  "Boa iluminação (de frente para a luz, sem sombras fortes)",
  "Fundo neutro e sem objetos",
  "Corpo inteiro visível, dos pés à cabeça",
  "Roupas justas ou adequadas para avaliação corporal",
  "Mesma distância da câmera em todas as avaliações (~2,5m)",
  "Mesma posição/pose a cada nova medição (braços levemente afastados)",
  "Câmera na altura aproximada do umbigo ou tórax, reta (sem inclinar)",
  "Evitar poses diferentes entre avaliações",
  "Evitar espelhos distorcidos ou lentes grande-angular",
];

const angles = [
  ["frente", "Frente", "De frente, braços levemente afastados"],
  ["lado_esquerdo", "Lado esquerdo", "Perfil esquerdo, braços relaxados"],
  ["lado_direito", "Lado direito", "Perfil direito, braços relaxados"],
  ["costas", "Costas", "De costas, braços levemente afastados"],
] as const;

export { angles as PHOTO_ANGLES };

export function BodyPhotoGuide() {
  return (
    <Card>
      <h3 className="flex items-center gap-2 font-bold">
        <Camera className="h-5 w-5 text-tech-600" /> Guia de fotos corporais
      </h3>
      <p className="mt-2 text-sm text-ink-soft dark:text-slate-400">
        Fotos padronizadas deixam a análise por IA mais consistente. As fotos ficam em área
        privada — só você acessa — e a análise gera <b>estimativas</b> com margem de erro declarada.
      </p>
      <ul className="mt-4 grid gap-2 text-sm text-ink-soft sm:grid-cols-2 dark:text-slate-300">
        {instructions.map((t) => (
          <li key={t} className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            {t}
          </li>
        ))}
      </ul>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {angles.map(([key, label, hint]) => (
          <div key={key} className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/60">
            <p className="text-2xl">🧍</p>
            <p className="mt-1 text-sm font-bold">{label}</p>
            <p className="text-xs text-ink-mute">{hint}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
