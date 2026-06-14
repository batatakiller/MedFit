// ════════════════════════════════════════════════════════════════════════
// Rate limiting — janela fixa em memória, executado no middleware (edge).
//
// Limites por grupo de rota, chave = rota + IP. O estado vive no worker do
// middleware: em deploy com múltiplas instâncias cada uma conta separado
// (proteção best-effort; para limite global usar Redis/Upstash no futuro).
// O GoTrue já aplica rate limit próprio nos endpoints de auth do Supabase.
// ════════════════════════════════════════════════════════════════════════

interface Rule {
  limit: number; // requisições permitidas por janela
  windowMs: number; // duração da janela
}

// Ordem importa: o primeiro prefixo que casar é aplicado.
const RULES: { prefix: string; rule: Rule }[] = [
  { prefix: "/api/ai/assessment", rule: { limit: 5, windowMs: 10 * 60_000 } }, // IA é cara
  { prefix: "/api/ai/chat", rule: { limit: 20, windowMs: 10 * 60_000 } },
  { prefix: "/api/body-scan", rule: { limit: 10, windowMs: 10 * 60_000 } },
  { prefix: "/api/account/delete", rule: { limit: 3, windowMs: 60 * 60_000 } },
  { prefix: "/api/storage/sign", rule: { limit: 60, windowMs: 60_000 } },
  { prefix: "/api/", rule: { limit: 100, windowMs: 60_000 } }, // demais APIs
];

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function sweep(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [k, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(k);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSec: number;
}

// Retorna null quando o caminho não tem regra (não é API).
export function checkRateLimit(pathname: string, ip: string): RateLimitResult | null {
  const match = RULES.find((r) => pathname.startsWith(r.prefix));
  if (!match) return null;

  const now = Date.now();
  sweep(now);

  const key = `${match.prefix}:${ip}`;
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + match.rule.windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;

  const remaining = Math.max(0, match.rule.limit - bucket.count);
  return {
    allowed: bucket.count <= match.rule.limit,
    limit: match.rule.limit,
    remaining,
    retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
  };
}

export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
