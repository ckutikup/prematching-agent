import { useState } from "react";
import { RefreshCw, SendHorizontal } from "lucide-react";
import { api } from "../lib/api";
import type { ChatTurn, StoredStudent } from "../types";

interface Props {
  student: StoredStudent;
  programSlug?: string;
  seed?: string;
  suggestions?: string[];
}

const DEFAULT_SUGGESTIONS = [
  "How competitive is this program?",
  "What should I prepare for the application?",
  "Any similar programs that are less selective?",
];

export function ChatPanel({ student, programSlug, seed, suggestions }: Props) {
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [message, setMessage] = useState(seed ?? "");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailed, setLastFailed] = useState<string | null>(null);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setError(null);
    setLastFailed(null);
    setMessage("");

    const beforeSend = history;
    const withUser: ChatTurn[] = [...history, { role: "user", content: trimmed }];
    setHistory(withUser);

    try {
      const res = await api.chat({
        student,
        program_slug: programSlug,
        history: beforeSend,
        message: trimmed,
      });
      setHistory([...withUser, { role: "assistant", content: res.reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      setLastFailed(trimmed);
    } finally {
      setSending(false);
    }
  }

  const prompts = suggestions ?? DEFAULT_SUGGESTIONS;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col h-[560px]">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Ask your counselor</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Follow up about fit, alternatives, or how to prepare.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {history.length === 0 && (
          <div className="text-sm text-gray-500">
            <p className="mb-2">Try one of these:</p>
            <ul className="space-y-1.5">
              {prompts.map((q) => (
                <li key={q}>
                  <button
                    onClick={() => send(q)}
                    className="text-left text-brand-700 hover:text-brand-800 hover:underline"
                  >
                    {q}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {history.map((turn, i) => (
          <div
            key={i}
            className={
              turn.role === "user"
                ? "ml-8 bg-brand-600 text-white rounded-xl rounded-tr-sm px-3.5 py-2.5 text-sm whitespace-pre-wrap"
                : "mr-8 bg-gray-100 text-gray-900 rounded-xl rounded-tl-sm px-3.5 py-2.5 text-sm whitespace-pre-wrap"
            }
          >
            {turn.content}
          </div>
        ))}

        {sending && (
          <div className="mr-8 bg-gray-100 text-gray-500 rounded-xl rounded-tl-sm px-3.5 py-2.5 text-sm">
            Thinking…
          </div>
        )}

        {error && (
          <div className="flex items-center justify-between gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            <span>{error}</span>
            {lastFailed && (
              <button
                onClick={() => {
                  setHistory((h) => h.slice(0, -1));
                  send(lastFailed);
                }}
                className="inline-flex items-center gap-1 font-medium text-red-800 hover:text-red-900"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            )}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(message);
        }}
        className="border-t border-gray-100 p-3 flex items-end gap-2"
      >
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask a follow-up…"
          rows={2}
          className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(message);
            }
          }}
        />
        <button
          type="submit"
          disabled={sending || !message.trim()}
          className="h-10 px-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center justify-center"
        >
          <SendHorizontal className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
