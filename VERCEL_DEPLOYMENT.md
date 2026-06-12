# Deployment na Vercel

## 1. Pré-requisitos

- Conta na [Vercel](https://vercel.com)
- Repositório GitHub conectado: `https://github.com/batatakiller/MedFit`

## 2. Deploy Automático

### Opção A: Via Dashboard Vercel

1. Acesse [dashboard.vercel.com](https://dashboard.vercel.com)
2. Clique em **"Add New..."** → **"Project"**
3. Selecione o repositório `batatakiller/MedFit`
4. Configure as variáveis de ambiente (veja seção 3)
5. Clique em **"Deploy"**

### Opção B: Via Vercel CLI

```bash
npm i -g vercel
vercel link  # Conecta ao projeto Vercel
vercel env pull  # Puxa variáveis do Vercel
vercel deploy --prod  # Deploy para produção
```

## 3. Variáveis de Ambiente Necessárias

Na aba **Settings** → **Environment Variables** no Vercel Dashboard, adicione:

| Variável | Valor | Escopo |
|----------|-------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `http://supabasekong-ymayvdahoe25pumdfxyh77wi.147.15.99.72.sslip.io` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (copie de `.env.local`) | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | (copie de `.env.local`) | Production (somente) |
| `ANTHROPIC_API_KEY` | (copie de `.env.local`) | Production (somente) |
| `MEDFIT_AI_MODEL` | `claude-haiku-4-5` | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | `https://your-vercel-app.vercel.app` | Production |
| `MEDFIT_EMBED_FUNCTION_URL` | (deixe vazio por enquanto) | — |
| `MEDFIT_SMPL_SERVICE_URL` | (deixe vazio por enquanto) | — |

## 4. Depois do Deploy

- ✅ Build automático em cada push para `main`
- ✅ Preview links para PRs
- ✅ Logs disponíveis em tempo real
- ✅ Rollback automático se a build falhar

## 5. Verificação Pós-Deploy

```bash
# Testar a build localmente (simula Vercel)
npm run build
npm run start
```

## 6. Troubleshooting

**Build falha com erro de dependências:**
- Verifique se `npm install` executa localmente
- Confirme que não há imports faltando

**Variáveis de ambiente não carregam:**
- Confirme que estão prefixadas com `NEXT_PUBLIC_` se precisam ser acessíveis no browser
- Aguarde o redeploy após adicionar variáveis

**API do Supabase retorna 403:**
- Verifique se o ANON_KEY está correto
- Confirme se o IP/domínio da Vercel está autorizado no Supabase

## 7. Recursos Adicionais

- [Documentação Vercel + Next.js](https://vercel.com/docs/frameworks/nextjs)
- [Variáveis de Ambiente no Vercel](https://vercel.com/docs/projects/environment-variables)
- [Deploy com Custom Domains](https://vercel.com/docs/custom-domains)
