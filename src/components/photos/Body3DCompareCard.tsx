"use client";

import dynamic from "next/dynamic";
import { Card, SectionTitle } from "@/components/ui";
import type { BodyMeasures } from "@/components/photos/Body3DViewer";

const Body3DViewer = dynamic(
  () => import("@/components/photos/Body3DViewer").then((m) => m.Body3DViewer),
  { ssr: false, loading: () => <div className="h-[380px] animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" /> }
);

// Comparação 3D entre o scan mais recente e o anterior (histórico).
export function Body3DCompareCard({
  heightCm,
  current,
  previous,
  currentDate,
  previousDate,
}: {
  heightCm: number;
  current: BodyMeasures;
  previous: BodyMeasures | null;
  currentDate: string;
  previousDate: string | null;
}) {
  return (
    <Card>
      <SectionTitle
        title="Análise 3D"
        subtitle={
          previous && previousDate
            ? `Scan de ${currentDate} (sólido) sobreposto ao de ${previousDate} (wireframe).`
            : `Avatar 3D do scan de ${currentDate}, gerado a partir das medidas estimadas.`
        }
      />
      <Body3DViewer heightCm={heightCm} current={current} previous={previous} />
    </Card>
  );
}
