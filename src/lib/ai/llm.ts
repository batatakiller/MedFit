import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// Integração com a API de IA (Anthropic/Claude). Quando ANTHROPIC_API_KEY não
// está configurada, o grafo usa o mock multiagente (lib/ai/mock.ts).

export function aiAvailable() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const MODEL = process.env.MEDFIT_AI_MODEL || "claude-opus-4-8";

let _client: Anthropic | null = null;
function client() {
  if (!_client) _client = new Anthropic();
  return _client;
}

export async function callAgent(opts: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<string> {
  const stream = client().messages.stream({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 8192,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  });
  const message = await stream.finalMessage();
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

// Extrai o primeiro objeto JSON da resposta do agente.
export function parseAgentJSON<T>(text: string): T {
  const direct = text.trim();
  try {
    return JSON.parse(direct) as T;
  } catch {
    const start = direct.indexOf("{");
    const end = direct.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(direct.slice(start, end + 1)) as T;
    }
    throw new Error("resposta do agente não contém JSON válido");
  }
}

export async function callAgentJSON<T>(opts: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<T> {
  const text = await callAgent(opts);
  return parseAgentJSON<T>(text);
}
