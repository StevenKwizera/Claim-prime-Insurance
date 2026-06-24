import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { SystemHelpChat } from "@/components/SystemHelpChat";

/** Floating help chat — shown on signed-in pages (bottom-right). */
export const HelpChatFab = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-slate-950/30 lg:bg-transparent"
          aria-hidden
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div
        className={`fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6 ${
          open ? "w-[min(100vw-2rem,24rem)] sm:w-96" : "w-auto"
        }`}
      >
        {open ? (
          <div className="max-h-[min(70vh,32rem)] w-full overflow-y-auto shadow-panel">
            <SystemHelpChat compact title="Help assistant" />
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-prime-600 to-prime-700 px-5 py-3.5 text-sm font-semibold text-white shadow-glow transition hover:from-prime-700 hover:to-prime-800"
          aria-expanded={open}
          aria-label={open ? "Close help chat" : "Open help chat"}
        >
          {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
          {open ? "Close" : "Help"}
        </button>
      </div>
    </>
  );
};
