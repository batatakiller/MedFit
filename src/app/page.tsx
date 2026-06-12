import Link from "next/link";
import {
  Activity, Apple, Brain, Camera, CheckCircle2, Dumbbell, HeartPulse,
  ShieldCheck, Smartphone, Stethoscope,
} from "lucide-react";

export const metadata = { title: "Med Fit — Sua equipe de saúde e performance com IA" };

const especialistas = [
  { icon: Stethoscope, name: "Médico do Esporte", desc: "Avalia riscos, condições clínicas e orienta os cuidados para evoluir com segurança." },
  { icon: Apple, name: "Nutricionista", desc: "Analisa sua dieta atual e cria a estratégia alimentar para o seu objetivo." },
  { icon: Dumbbell, name: "Treinador Físico", desc: "Monta treinos progressivos para o seu nível, equipamentos e rotina." },
  { icon: Camera, name: "Análise Corporal por Imagem", desc: "Estima composição corporal, medidas e postura pelas suas fotos — com margem de erro declarada." },
  { icon: Brain, name: "Supervisor de IA", desc: "Coordena os especialistas, cruza os dados e garante um plano seguro e coerente." },
];

const passos = [
  ["Cadastre seu perfil", "Dados pessoais, saúde, medidas, dieta, treino, exames e fotos — com consentimento LGPD em cada etapa."],
  ["A equipe de IA analisa", "Os 5 agentes conversam entre si, cruzam seus dados e o supervisor valida a segurança do plano."],
  ["Receba o plano integrado", "Estratégia de 30 dias com dieta, treino, hábitos, metas e indicadores de progresso."],
  ["Acompanhe no celular", "Treino do dia, dieta do dia, água, medicamentos cadastrados, check-ins e evolução mensal."],
];

const planos = [
  { name: "Gratuito", price: "R$ 0", features: ["1 análise multiagente", "Acompanhamento diário", "Registro de medidas e água", "PWA instalável"], cta: "Começar grátis", highlight: false },
  { name: "Essencial", price: "R$ 39/mês", features: ["Análises mensais ilimitadas", "Análise corporal por fotos", "OCR de exames", "Lembretes e notificações"], cta: "Assinar Essencial", highlight: true },
  { name: "Performance", price: "R$ 79/mês", features: ["Tudo do Essencial", "Histórico de body scans", "Comparativo visual de evolução", "Memória longitudinal (RAG)"], cta: "Assinar Performance", highlight: false },
];

export default function LandingPage() {
  return (
    <main className="bg-white text-ink">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-extrabold text-lg">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-white">
              <HeartPulse className="h-5 w-5" />
            </span>
            Med <span className="text-brand-600">Fit</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary px-4 py-2 text-sm">Entrar</Link>
            <Link href="/cadastro" className="btn-primary px-4 py-2 text-sm">Criar conta</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-brand-gradient-soft">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div>
            <span className="chip bg-white text-brand-700 shadow-sm">
              <Brain className="h-3.5 w-3.5" /> Equipe multidisciplinar de IA
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              Do corpo de hoje ao corpo que você quer —{" "}
              <span className="bg-brand-gradient bg-clip-text text-transparent">com segurança</span>.
            </h1>
            <p className="mt-4 max-w-lg text-lg text-ink-soft">
              O Med Fit analisa sua saúde, composição corporal, dieta e rotina com 5 especialistas
              virtuais que conversam entre si — e gera um plano integrado, progressivo e seguro,
              acompanhado dia a dia pelo seu celular.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/cadastro" className="btn-gradient">Começar minha análise</Link>
              <Link href="#como-funciona" className="btn-secondary">Como funciona</Link>
            </div>
            <p className="mt-5 max-w-lg text-xs text-ink-mute">
              O Med Fit é apoio educacional, estratégico e preventivo. Não substitui consulta médica,
              diagnóstico, prescrição, nutricionista ou treinador presencial.
            </p>
          </div>
          <div className="card mx-auto w-full max-w-sm p-6">
            <p className="text-sm font-semibold text-ink-mute">A equipe conversa sobre você:</p>
            <div className="mt-3 space-y-3 text-sm">
              <div className="rounded-xl bg-slate-50 p-3"><b className="text-tech-700">Médico:</b> sobrepeso + pressão alta → progressão lenta e validação presencial.</div>
              <div className="rounded-xl bg-slate-50 p-3"><b className="text-brand-700">Nutricionista:</b> déficit moderado, mais fibras e proteína.</div>
              <div className="rounded-xl bg-slate-50 p-3"><b className="text-amber-700">Treinador:</b> caminhada + força leve, evoluindo a cada mês.</div>
              <div className="rounded-xl bg-slate-50 p-3"><b className="text-purple-700">Visão corporal:</b> acompanhar cintura, abdômen e fotos mensais.</div>
              <div className="rounded-xl border border-brand-200 bg-brand-50 p-3"><b className="text-brand-800">Supervisor:</b> plano aprovado com foco em segurança ✓</div>
            </div>
          </div>
        </div>
      </section>

      {/* Especialistas */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-extrabold">Seus 5 especialistas virtuais</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-ink-soft">
          Cada agente analisa seus dados sob a própria perspectiva — depois eles cruzam tudo e
          chegam a uma estratégia única.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {especialistas.map((e) => (
            <div key={e.name} className="card p-5 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-gradient-soft">
                <e.icon className="h-6 w-6 text-brand-700" />
              </span>
              <h3 className="mt-3 font-bold">{e.name}</h3>
              <p className="mt-1 text-sm text-ink-soft">{e.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-extrabold">Como funciona</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-4">
            {passos.map(([t, d], i) => (
              <div key={t} className="card p-5">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-gradient text-sm font-bold text-white">{i + 1}</span>
                <h3 className="mt-3 font-bold">{t}</h3>
                <p className="mt-1 text-sm text-ink-soft">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Análise corporal + mobile */}
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2">
        <div className="card p-7">
          <Camera className="h-8 w-8 text-tech-600" />
          <h3 className="mt-3 text-2xl font-extrabold">Análise corporal por imagem</h3>
          <p className="mt-2 text-ink-soft">
            Envie fotos de frente, costas e perfis. O pipeline híbrido (segmentação + landmarks de
            pose + escala pela sua altura) estima medidas, composição e postura — sempre com
            nível de confiança e margem de erro declarados.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-ink-soft">
            {["Comparativo mês a mês lado a lado", "Estimativa de % de gordura e medidas", "Histórico visual de evolução"].map((f) => (
              <li key={f} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600" />{f}</li>
            ))}
          </ul>
        </div>
        <div className="card p-7">
          <Smartphone className="h-8 w-8 text-brand-600" />
          <h3 className="mt-3 text-2xl font-extrabold">Acompanhamento diário no celular</h3>
          <p className="mt-2 text-ink-soft">
            Instale como app (PWA) e acompanhe o dia: treino, refeições, água, medicamentos que
            você cadastrou, check-ins rápidos e alertas.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-ink-soft">
            {["Checklist diário com 1 toque", "Cronômetro de descanso no treino", "Lembretes de água, refeição e medicamentos cadastrados"].map((f) => (
              <li key={f} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600" />{f}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Segurança */}
      <section className="bg-slate-900 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-brand-400" />
          <h2 className="mt-3 text-3xl font-extrabold">Segurança e responsabilidade em primeiro lugar</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-300">
            Seus dados são protegidos com Row Level Security e buckets privados — só você acessa o que é seu.
            A IA nunca prescreve, altera ou suspende medicamentos, não promete resultados e sempre indica
            validação por profissionais habilitados quando há qualquer condição clínica relevante.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
            <span className="chip bg-white/10 text-white">LGPD + consentimentos específicos</span>
            <span className="chip bg-white/10 text-white">Criptografia e URLs assinadas</span>
            <span className="chip bg-white/10 text-white">Validação de segurança antes de cada plano</span>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-center text-3xl font-extrabold">Planos</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {planos.map((p) => (
            <div key={p.name} className={`card p-6 ${p.highlight ? "ring-2 ring-brand-500" : ""}`}>
              {p.highlight && <span className="chip bg-brand-100 text-brand-800">Mais popular</span>}
              <h3 className="mt-2 text-xl font-extrabold">{p.name}</h3>
              <p className="mt-1 text-3xl font-extrabold">{p.price}</p>
              <ul className="mt-4 space-y-2 text-sm text-ink-soft">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600" />{f}</li>
                ))}
              </ul>
              <Link href="/cadastro" className={`mt-6 w-full ${p.highlight ? "btn-gradient" : "btn-secondary"}`}>{p.cta}</Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-brand-gradient py-16 text-center text-white">
        <Activity className="mx-auto h-10 w-10" />
        <h2 className="mt-3 text-3xl font-extrabold">Comece hoje a evolução do seu corpo</h2>
        <p className="mt-2 text-white/85">Cadastro gratuito. Primeira análise multiagente em minutos.</p>
        <Link href="/cadastro" className="mt-6 inline-flex rounded-xl bg-white px-8 py-3.5 font-bold text-brand-700 shadow-lift transition hover:bg-brand-50">
          Criar minha conta
        </Link>
      </section>

      <footer className="border-t border-slate-100 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 text-sm text-ink-mute">
          <p>© {new Date().getFullYear()} Med Fit — apoio educacional; não substitui profissionais de saúde.</p>
          <div className="flex gap-5">
            <Link href="/termos" className="hover:text-ink">Termos de uso</Link>
            <Link href="/privacidade" className="hover:text-ink">Privacidade</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
