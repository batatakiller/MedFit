import Link from "next/link";

export const metadata = { title: "Política de privacidade" };

export default function PrivacidadePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">Política de Privacidade — Med Fit</h1>
      <p className="mt-1 text-sm text-ink-mute">Versão 1.0 · LGPD (Lei 13.709/2018)</p>

      <div className="mt-8 space-y-6 text-ink-soft [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-ink">
        <section>
          <h2>1. Dados que coletamos</h2>
          <p>
            Dados cadastrais (nome, e-mail), dados físicos (peso, altura, medidas), dados sensíveis
            de saúde (condições clínicas, medicamentos informados por você, exames, check-ins),
            fotos corporais e registros de uso (treinos, refeições, água).
          </p>
        </section>
        <section>
          <h2>2. Como a IA usa seus dados</h2>
          <p>
            Seus dados alimentam uma equipe de agentes de IA (médico do esporte, nutricionista,
            treinador, análise corporal e supervisor) que gera orientações educacionais
            personalizadas. Trechos do seu histórico são vetorizados (embeddings) para que a IA
            lembre da sua evolução. Os dados <b>não são usados para treinar modelos</b> de terceiros
            e <b>não são vendidos</b>.
          </p>
        </section>
        <section>
          <h2>3. Consentimentos específicos</h2>
          <p>
            Antes de usar dados sensíveis pedimos consentimentos separados para: dados de saúde,
            upload de exames, análise corporal por fotos e lembretes de medicamentos cadastrados.
            Você pode revogá-los a qualquer momento em Configurações.
          </p>
        </section>
        <section>
          <h2>4. Segurança</h2>
          <p>
            Row Level Security em todas as tabelas (cada paciente acessa apenas os próprios dados),
            buckets de arquivos privados com URLs assinadas temporárias, criptografia em trânsito e
            em repouso, e segregação de chaves (a chave administrativa nunca chega ao navegador).
          </p>
        </section>
        <section>
          <h2>5. Seus direitos (LGPD)</h2>
          <p>
            Acessar e exportar seus dados, corrigir dados incompletos, revogar consentimentos,
            excluir exames e fotos, e excluir a conta com todos os dados associados — tudo
            disponível em <b>Configurações</b> ou pelo e-mail privacidade@medfit.app.
          </p>
        </section>
        <section>
          <h2>6. Retenção</h2>
          <p>
            Dados são mantidos enquanto a conta existir. Ao excluir a conta, dados pessoais,
            exames, fotos e embeddings são removidos definitivamente em até 30 dias, salvo
            obrigações legais.
          </p>
        </section>
      </div>

      <Link href="/" className="btn-secondary mt-10">Voltar ao início</Link>
    </main>
  );
}
