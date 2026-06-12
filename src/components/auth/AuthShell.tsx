import Link from "next/link";
import { HeartPulse } from "lucide-react";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-brand-gradient-soft px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 text-xl font-extrabold">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-gradient text-white">
            <HeartPulse className="h-5 w-5" />
          </span>
          Med <span className="text-brand-600">Fit</span>
        </Link>
        <div className="card p-7">
          <h1 className="text-xl font-extrabold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </main>
  );
}
