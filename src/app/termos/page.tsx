import Link from "next/link";

export const metadata = { title: "Termos de uso" };

export default function TermosPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">Termos de Uso — Med Fit</h1>
      <p className="mt-1 text-sm text-ink-mute">Versão 1.0 · Última atualização: junho de 2026</p>

      <div className="prose-sm mt-8 space-y-6 text-ink-soft [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-ink">
        <section>
          <h2>1. Natureza do serviço</h2>
          <p>
            O Med Fit é uma plataforma de apoio <b>educacional, estratégico e preventivo</b> para
            acompanhamento de saúde, composição corporal, dieta, treino e rotina diária, com auxílio
            de inteligência artificial multiagente.
          </p>
          <p>
            <b>O Med Fit NÃO substitui</b> atendimento médico real, diagnóstico médico, prescrição
            médica, consulta presencial, nutricionista presencial ou treinador presencial. Nenhum
            conteúdo gerado pela plataforma constitui ato médico, nutricional ou de educação física.
          </p>
        </section>
        <section>
          <h2>2. Medicamentos</h2>
          <p>
            A área de medicamentos serve <b>exclusivamente</b> para registrar medicamentos já
            utilizados pelo paciente, acompanhar horários informados e gerar lembretes. O Med Fit
            não prescreve, não altera, não suspende e não recomenda dosagens de medicamentos.
            Medicamentos devem ser definidos e acompanhados por médico habilitado.
          </p>
        </section>
        <section>
          <h2>3. Limitações da IA</h2>
          <p>
            As análises (incluindo a análise corporal por fotos) são estimativas com margem de erro
            e nível de confiança declarados. A IA não promete resultados. Diante de doenças,
            medicamentos, exames alterados, pressão alta, diabetes, obesidade, lesões, dor no peito,
            tontura, falta de ar ou qualquer sintoma de risco, procure imediatamente um profissional
            de saúde habilitado.
          </p>
        </section>
        <section>
          <h2>4. Responsabilidades do usuário</h2>
          <p>
            Você se compromete a fornecer informações verdadeiras, manter sua senha em sigilo,
            usar a plataforma apenas para fins pessoais e interromper qualquer atividade física em
            caso de mal-estar, buscando atendimento médico.
          </p>
        </section>
        <section>
          <h2>5. Assinaturas e cancelamento</h2>
          <p>
            Planos pagos são cobrados de forma recorrente e podem ser cancelados a qualquer momento,
            permanecendo ativos até o fim do período já pago.
          </p>
        </section>
        <section>
          <h2>6. Privacidade</h2>
          <p>
            O tratamento de dados pessoais e sensíveis é descrito na{" "}
            <Link href="/privacidade" className="text-tech-600 underline">Política de Privacidade</Link>,
            que integra estes Termos.
          </p>
        </section>
      </div>

      <Link href="/" className="btn-secondary mt-10">Voltar ao início</Link>
    </main>
  );
}
