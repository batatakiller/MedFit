"use client";

import { FormEvent, useMemo, useState } from "react";
import { RotateCcw, Send, ShieldCheck, Sparkles } from "lucide-react";
import { EducationalNotice, SafetyWarningCard } from "@/components/ui";
import { cn } from "@/lib/utils";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  referencedData?: string[];
  safetyWarnings?: string[];
  suggestedActions?: string[];
};

type ChatResponse = {
  answer: string;
  referenced_data: string[];
  safety_warnings: string[];
  suggested_actions: string[];
  error?: string;
  redirect?: string;
};

const suggestions = [
  "O que mais devo observar esta semana?",
  "Meu treino está coerente com meus alertas?",
  "Como ajustar a dieta sem exagerar?",
  "Quais dados estão faltando para uma resposta melhor?",
];

export function PatientChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "assistant",
      content:
        "Posso cruzar sua última avaliação, plano, exames, body scan e check-ins para responder dúvidas com segurança.",
      referencedData: ["Contexto autorizado da sua sessão"],
      safetyWarnings: [],
      suggestedActions: [],
    },
  ]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const history = useMemo(
    () =>
      messages
        .filter((m) => m.id !== "intro")
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content })),
    [messages]
  );

  async function sendQuestion(nextQuestion?: string) {
    const text = (nextQuestion ?? question).trim();
    if (text.length < 3 || loading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, history }),
      });
      const data = (await res.json().catch(() => ({}))) as ChatResponse;
      if (!res.ok) {
        throw new Error(data.error ?? "Não foi possível responder agora.");
      }

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.answer,
          referencedData: data.referenced_data ?? [],
          safetyWarnings: data.safety_warnings ?? [],
          suggestedActions: data.suggested_actions ?? [],
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível responder agora.");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void sendQuestion();
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="card flex min-h-[620px] flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="font-bold text-ink dark:text-white">Chat Med Fit</p>
              <p className="text-xs text-ink-mute">Sessão autenticada</p>
            </div>
          </div>
          <button
            type="button"
            className="btn-secondary px-3 py-2"
            onClick={() => {
              setMessages((current) => current.slice(0, 1));
              setError(null);
            }}
            title="Limpar conversa"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/70 p-4 dark:bg-slate-950/60">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {loading && (
            <div className="max-w-[88%] rounded-2xl rounded-bl-md bg-white p-4 text-sm text-ink-soft shadow-sm dark:bg-slate-900 dark:text-slate-300">
              Analisando seus dados cruzados...
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="border-t border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          {error && (
            <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <textarea
              className="input min-h-[52px] resize-none"
              maxLength={1000}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Pergunte sobre seu plano, exames, dieta, treino ou evolução..."
            />
            <button className="btn-primary h-[52px] px-4" disabled={loading || question.trim().length < 3} title="Enviar">
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>
      </section>

      <aside className="space-y-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 font-bold text-ink dark:text-white">
            <ShieldCheck className="h-5 w-5 text-brand-600" />
            Contexto protegido
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft dark:text-slate-400">
            O chat consulta seus dados no servidor usando a sessão atual. A pergunta não carrega identidade,
            chaves ou dados de outro usuário.
          </p>
        </div>

        <div className="card p-4">
          <p className="font-bold text-ink dark:text-white">Perguntas rápidas</p>
          <div className="mt-3 space-y-2">
            {suggestions.map((item) => (
              <button
                key={item}
                type="button"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-left text-sm font-medium text-ink-soft transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-brand-950/30 dark:hover:text-brand-200"
                disabled={loading}
                onClick={() => void sendQuestion(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <EducationalNotice />
      </aside>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm",
          isUser
            ? "rounded-br-md bg-brand-600 text-white"
            : "rounded-bl-md bg-white text-ink dark:bg-slate-900 dark:text-slate-100"
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {!isUser && Boolean(message.referencedData?.length) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {message.referencedData!.slice(0, 4).map((item) => (
              <span key={item} className="chip bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {item}
              </span>
            ))}
          </div>
        )}
        {!isUser && Boolean(message.safetyWarnings?.length) && (
          <div className="mt-3">
            <SafetyWarningCard warnings={message.safetyWarnings!} title="Cuidados" />
          </div>
        )}
        {!isUser && Boolean(message.suggestedActions?.length) && (
          <ul className="mt-3 space-y-1.5 text-xs text-ink-soft dark:text-slate-400">
            {message.suggestedActions!.slice(0, 4).map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
