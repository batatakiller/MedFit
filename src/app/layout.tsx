import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RegisterSW } from "@/components/mobile/RegisterSW";

export const metadata: Metadata = {
  title: { default: "Med Fit — Saúde e Performance com IA", template: "%s · Med Fit" },
  description:
    "Plataforma de acompanhamento de saúde, composição corporal, dieta, treino e evolução com equipe multidisciplinar virtual de IA. Apoio educacional — não substitui profissionais de saúde.",
  manifest: "/manifest.json",
  icons: { icon: "/icons/icon.svg", apple: "/icons/icon-192.png" },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Med Fit" },
};

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
