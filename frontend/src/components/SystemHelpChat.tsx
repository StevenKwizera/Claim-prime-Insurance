import { FormEvent, useMemo, useState } from "react";
import { Bot, SendHorizontal } from "lucide-react";
import { answerSystemQuestion } from "@/services/aiAssistant";

interface Message {
  sender: "user" | "assistant";
  text: string;
  confidence?: number;
  sources?: string[];
  suggestions?: string[];
}

export const SystemHelpChat = ({
  compact = false,
  title = "System Help Chat",
  minimal = false
}: {
  compact?: boolean;
  title?: string;
  minimal?: boolean;
}) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "assistant",
      text: "Ask me about claim submission, required documents by claim type, tracking, verification, fraud review, reports, or roles.",
      confidence: 0.95,
      sources: ["System help knowledge"],
      suggestions: [
        "What documents are required for an auto claim?",
        "How do I submit a claim?",
        "How does claim routing work?"
      ]
    }
  ]);

  const quickQuestions = useMemo(
    () => [
      "What documents are required for an auto claim?",
      "How do I verify documents?",
      "How can I track claim status?"
    ],
    []
  );

  const visibleMessages = minimal ? messages.slice(-3) : messages.slice(-5);
  const visibleQuestions = minimal ? quickQuestions.slice(0, 2) : quickQuestions;

  const ask = (question: string) => {
    if (!question.trim()) return;

    const response = answerSystemQuestion(question);
    setMessages((current) => [
      ...current,
      { sender: "user", text: question },
      {
        sender: "assistant",
        text: response.answer,
        confidence: response.confidence,
        sources: response.sources,
        suggestions: response.suggestions
      }
    ]);
    setInput("");
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    ask(input);
  };

  return (
    <div className={`card ${minimal ? "p-4" : compact ? "p-4" : "p-6"}`}>
      <div className="flex items-center gap-3">
        <div className={`rounded-2xl bg-prime-50 text-prime-700 ${minimal ? "p-2.5" : "p-3"}`}>
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h3 className={`${compact ? "text-lg" : "text-xl"} font-bold text-slate-900`}>{title}</h3>
          <p className="text-sm text-slate-500">
            {minimal
              ? "Quick answers without leaving the login page."
              : "Grounded system answers with confidence and knowledge sources."}
          </p>
        </div>
      </div>

      <div
        className={`mt-5 space-y-3 rounded-3xl bg-slate-50 ${minimal ? "max-h-56 overflow-y-auto p-3" : compact ? "p-3" : "p-4"}`}
      >
        {visibleMessages.map((message, index) => (
          <div key={`${message.sender}-${index}`} className={message.sender === "assistant" ? "" : "flex justify-end"}>
            <div
              className={`max-w-[95%] rounded-2xl px-4 py-3 text-sm ${
                message.sender === "assistant"
                  ? "bg-white text-slate-700"
                  : "bg-prime-600 text-white"
              }`}
            >
              <p>{message.text}</p>
              {message.sender === "assistant" && message.confidence ? (
                <>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-600">
                      Confidence {Math.round(message.confidence * 100)}%
                    </span>
                    {message.sources?.map((source) => (
                      <span key={source} className="rounded-full bg-prime-50 px-2 py-1 font-medium text-prime-700">
                        {source}
                      </span>
                    ))}
                  </div>
                  {!minimal && message.suggestions?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.suggestions.slice(0, 3).map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => ask(suggestion)}
                          className="rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {visibleQuestions.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => ask(question)}
            className={`rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 ${minimal ? "px-2.5 py-1.5" : "px-3 py-2"}`}
          >
            {question}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-3">
        <input
          className="input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={minimal ? "Ask about claims, documents, or tracking..." : "Ask a question about the system..."}
        />
        <button className="btn-primary gap-2" type="submit">
          <SendHorizontal className="h-4 w-4" />
          {minimal ? "Send" : "Ask"}
        </button>
      </form>
    </div>
  );
};
