# 🛡️ Diretrizes de Segurança, Privacidade e LGPD (SECURITY.md)

Este documento descreve os mecanismos de segurança implementados no **Med Fit** para proteção de dados clínicos, dados pessoais e conformidade com a LGPD.

---

## 🔒 1. Row Level Security (RLS) no PostgreSQL

A segurança de dados no Med Fit começa no banco de dados. Nenhuma query direta é executada sem passar pelas regras de Row Level Security (RLS) do Supabase:
*   **Ativação:** RLS está ativado em todas as tabelas (25+).
*   **Política Padrão:** O acesso a qualquer linha é restrito à condição `user_id = auth.uid()` (o ID do usuário autenticado no Supabase Auth deve ser idêntico ao ID da linha).
*   **Exceção de Tabelas Públicas:** Apenas tabelas de consentimento geral e termos de uso podem ser lidas por usuários anônimos.
*   **Script de Validação:** Existe uma suíte de testes de RLS em `tests/rls.test.sql` que pode ser executada para garantir que nenhum usuário consiga visualizar, atualizar ou deletar dados de outros perfis.

---

## 📂 2. Segurança de Arquivos e Armazenamento (Storage)

Os uploads de fotos e exames são considerados dados sensíveis. O sistema de storage segue regras rígidas:
*   **Buckets Privados:** Os buckets `exams`, `body-photos` e `avatars` são marcados como privados.
*   **Estrutura de Pastas:** O caminho do arquivo segue a estrutura `{user_id}/{filename}`, impedindo acessos cruzados.
*   **URLs Assinadas:** O frontend não acessa o arquivo diretamente. Em vez disso, solicita uma URL assinada (Signed URL) que expira em **10 minutos**. Após esse período, o link torna-se inválido.

---

## 🔑 3. Proteção de Chaves de Acesso e Código Server-Only

Para evitar vazamento de credenciais e chaves privadas (como a `SUPABASE_SERVICE_ROLE_KEY` e a `ANTHROPIC_API_KEY`):
*   **Server-Only Files:** Os arquivos de conexão administrativa do Supabase (`src/lib/supabase/admin.ts`) usam o pacote `server-only`. Isso garante que a compilação do Next.js gere um erro de build se algum desenvolvedor tentar importar esse código no lado do cliente.
*   **Variáveis de Ambiente:** Chaves sensíveis ficam armazenadas estritamente no ambiente de execução do servidor (Vercel ou servidor local), e nunca recebem o prefixo `NEXT_PUBLIC_`.

---

## 🧼 4. Sanitização de Inputs e Validação com Zod

*   **Validação Rígida:** Todos os dados recebidos via formulários no frontend e endpoints da API são validados utilizando schemas do **Zod** (localizados em `src/lib/validators.ts`). Isso previne inputs inválidos ou injeções de dados maliciosos.
*   **Sanitização de HTML:** Toda entrada de texto livre passa por um helper de sanitização (`safeText`) que remove tags HTML e scripts suspeitos para evitar vulnerabilidades de Cross-Site Scripting (XSS).

---

## ⚖️ 5. Conformidade com a LGPD (Lei Geral de Proteção de Dados)

O Med Fit foi construído pensando nas diretrizes da LGPD:
1.  **Consentimento Expresso:** Durante o onboarding, o paciente deve aceitar ativamente os consentimentos para:
    *   Tratamento de dados de saúde.
    *   Armazenamento de exames laboratoriais.
    *   Processamento de fotos corporais.
    *   Recebimento de lembretes e notificações.
2.  **Versionamento de Termos:** Caso as políticas do app mudem, os termos são versionados no banco de dados e os usuários são convidados a consentir novamente.
3.  **Portabilidade de Dados (Exportar):** Disponível na tela de Configurações, o usuário pode clicar em "Exportar Dados Pessoais" para baixar um arquivo JSON completo contendo todo o seu histórico cadastral, treinos, dietas e logs de check-in.
4.  **Direito ao Esquecimento (Deleção):**
    *   O usuário pode deletar arquivos individuais (exames ou fotos de evolução), o que aciona triggers para remover fisicamente os arquivos do bucket correspondente.
    *   O usuário pode solicitar a exclusão definitiva da conta. Esse processo deleta em cascata todos os registros vinculados ao seu ID do banco e do storage.
