import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// Integração com a API de IA. OpenRouter é preferido quando configurado,
// permitindo roteamento por agente; Anthropic direto fica como fallback local.

export type AgentModelTask =
  | "bodyVision"
  | "medical"
  | "nutrition"
  | "training"
  | "discussion"
  | "safety"
  | "safetyReview"
  | "integrated"
  | "daily";

export function aiAvailable() {
  return Boolean(process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY);
}

const ANTHROPIC_MODEL = process.env.MEDFIT_AI_MODEL || "claude-opus-4-8";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_DEFAULT_MODEL =
  process.env.MEDFIT_OPENROUTER_MODEL_DEFAULT || "openai/gpt-5.4";

const OPENROUTER_MODELS: Record<AgentModelTask, string> = {
  bodyVision: process.env.MEDFIT_OPENROUTER_MODEL_BODY_VISION || "google/gemini-3.5-flash",
  medical: process.env.MEDFIT_OPENROUTER_MODEL_MEDICAL || "openai/gpt-5.5",
  nutrition: process.env.MEDFIT_OPENROUTER_MODEL_NUTRITION || "openai/gpt-5.4",
  training: process.env.MEDFIT_OPENROUTER_MODEL_TRAINING || "openai/gpt-5.4",
  discussion: process.env.MEDFIT_OPENROUTER_MODEL_DISCUSSION || "anthropic/claude-sonnet-4.6",
  safety: process.env.MEDFIT_OPENROUTER_MODEL_SAFETY || "openai/gpt-5.5",
  safetyReview: process.env.MEDFIT_OPENROUTER_MODEL_SAFETY_REVIEW || "anthropic/claude-opus-4.8",
  integrated: process.env.MEDFIT_OPENROUTER_MODEL_INTEGRATED || "openai/gpt-5.5",
  daily: process.env.MEDFIT_OPENROUTER_MODEL_DAILY || "openai/gpt-5.4-mini",
};

let _client: Anthropic | null = null;
function client() {
  if (!_client) _client = new Anthropic();
  return _client;
}

export async function callAgent(opts: {
  system: string;
  user: string;
  task?: AgentModelTask;
  model?: string;
  maxTokens?: number;
}): Promise<string> {
  if (process.env.OPENROUTER_API_KEY) {
    return callOpenRouter(opts);
  }

  const stream = client().messages.stream({
    model: opts.model ?? ANTHROPIC_MODEL,
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

async function callOpenRouter(opts: {
  system: string;
  user: string;
  task?: AgentModelTask;
  model?: string;
  maxTokens?: number;
}): Promise<string> {
  const model = opts.model ?? (opts.task ? OPENROUTER_MODELS[opts.task] : OPENROUTER_DEFAULT_MODEL);
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-OpenRouter-Title": "Med Fit",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
      max_tokens: opts.maxTokens ?? 8192,
    }),
  });

  const json = await response.json().catch(() => null) as OpenRouterResponse | null;
  if (!response.ok) {
    const message = json?.error?.message ?? `falha OpenRouter (${response.status})`;
    throw new Error(message);
  }

  const content = json?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => typeof part === "string" ? part : part.text ?? "")
      .join("");
  }
  throw new Error("OpenRouter não retornou conteúdo textual");
}

type OpenRouterResponse = {
  choices?: {
    message?: {
      content?: string | ({ text?: string } | string)[];
    };
  }[];
  error?: { message?: string };
};

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
  task?: AgentModelTask;
  model?: string;
  maxTokens?: number;
}): Promise<T> {
  const text = await callAgent(opts);
  return parseAgentJSON<T>(text);
}
