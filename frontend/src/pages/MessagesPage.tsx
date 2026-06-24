import { PageHeader } from "@/components/PageHeader";
import {
  useMessageContacts,
  useMessageConversations,
  useMessageThread,
  useSendDirectMessage
} from "@/hooks/useMessages";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const roleLabel = (role: string) =>
  role
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const timeAgo = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) {
    return "just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export const MessagesPage = () => {
  const currentUser = useAuthStore((state) => state.user);
  const { data: contacts = [], isLoading: contactsLoading } = useMessageContacts();
  const { data: conversations = [] } = useMessageConversations();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [composeToId, setComposeToId] = useState("");
  const [draft, setDraft] = useState("");
  const [relatedClaimId, setRelatedClaimId] = useState("");
  const sendMessage = useSendDirectMessage();
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  const activeUserId = composeToId || selectedUserId;
  const { data: displayThread = [], refetch: refetchThread } = useMessageThread(activeUserId);

  const contactById = useMemo(() => new Map(contacts.map((user) => [user.id, user])), [contacts]);

  const selectedContact = activeUserId ? contactById.get(activeUserId) : undefined;

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayThread.length, activeUserId]);

  const openConversation = (userId: string) => {
    setSelectedUserId(userId);
    setComposeToId(userId);
  };

  const handleSend = () => {
    const toUserId = composeToId || selectedUserId;
    const body = draft.trim();
    if (!toUserId) {
      toast.error("Choose who you want to message.");
      return;
    }
    if (!body) {
      toast.error("Type a message first.");
      return;
    }

    sendMessage.mutate(
      {
        toUserId,
        body,
        relatedClaimId: relatedClaimId.trim() || undefined
      },
      {
        onSuccess: () => {
          setDraft("");
          setSelectedUserId(toUserId);
          setComposeToId(toUserId);
          refetchThread();
          toast.success("Message sent.");
        },
        onError: () => toast.error("Could not send message.")
      }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Direct messages"
        title="Message anyone in the portal"
        description="Send private text to claimants, officers, supervisors, or other staff. Pick a person, write your message, and keep the thread in one place."
        actions={
          <Link to="/notifications" className="btn-secondary">
            System notifications
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <div className="card flex flex-col p-4">
          <h3 className="text-lg font-bold text-navy-900">Conversations</h3>
          <p className="mt-1 text-sm text-slate-500">People you have messaged or received from.</p>
          <div className="mt-4 flex-1 space-y-2 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                No conversations yet. Choose someone on the right to start.
              </p>
            ) : (
              conversations.map((item) => (
                <button
                  key={item.userId}
                  type="button"
                  onClick={() => openConversation(item.userId)}
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    selectedUserId === item.userId
                      ? "border-prime-300 bg-prime-50"
                      : "border-slate-200 hover:border-prime-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-navy-900">{item.userName}</p>
                      <p className="text-xs text-slate-500">{roleLabel(item.userRole)}</p>
                    </div>
                    {item.unreadCount > 0 ? (
                      <span className="rounded-full bg-prime-600 px-2 py-0.5 text-xs font-semibold text-white">
                        {item.unreadCount}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">{item.lastMessage}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {timeAgo(item.lastAt)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="card flex min-h-[520px] flex-col p-4">
          <div className="border-b border-slate-200 pb-4">
            <label className="text-sm font-semibold text-slate-700" htmlFor="message-recipient">
              Message to
            </label>
            <select
              id="message-recipient"
              className="input-field mt-2"
              value={composeToId}
              disabled={contactsLoading}
              onChange={(event) => {
                const next = event.target.value;
                setComposeToId(next);
                setSelectedUserId(next || null);
              }}
            >
              <option value="">Select a user…</option>
              {contacts.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({roleLabel(user.role)})
                  {user.id === currentUser?.id ? " — you" : ""}
                </option>
              ))}
            </select>
            {selectedContact ? (
              <p className="mt-2 text-sm text-slate-500">
                {selectedContact.email} · {roleLabel(selectedContact.role)}
              </p>
            ) : null}
            <label className="mt-3 block text-sm font-semibold text-slate-700" htmlFor="related-claim">
              Related claim (optional)
            </label>
            <input
              id="related-claim"
              className="input-field mt-2"
              placeholder="e.g. CLM-2026-001"
              value={relatedClaimId}
              onChange={(event) => setRelatedClaimId(event.target.value)}
            />
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto py-4">
            {!activeUserId ? (
              <p className="text-sm text-slate-500">Select a recipient to view or start a conversation.</p>
            ) : displayThread.length === 0 ? (
              <p className="text-sm text-slate-500">No messages yet. Say hello below.</p>
            ) : (
              displayThread.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                      message.mine
                        ? "bg-prime-600 text-white"
                        : "border border-slate-200 bg-slate-50 text-slate-800"
                    }`}
                  >
                    <p className="text-xs font-semibold opacity-80">
                      {message.mine ? "You" : message.fromUserName}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{message.body}</p>
                    {message.relatedClaimId ? (
                      <Link
                        to={`/claims/${message.relatedClaimId}`}
                        className={`mt-2 inline-block text-xs font-semibold underline ${
                          message.mine ? "text-prime-100" : "text-prime-700"
                        }`}
                      >
                        Claim {message.relatedClaimId}
                      </Link>
                    ) : null}
                    <p className={`mt-2 text-xs ${message.mine ? "text-prime-100" : "text-slate-400"}`}>
                      {timeAgo(message.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={threadEndRef} />
          </div>

          <div className="border-t border-slate-200 pt-4">
            <label className="sr-only" htmlFor="message-body">
              Message
            </label>
            <textarea
              id="message-body"
              className="input-field min-h-[96px] resize-y"
              placeholder="Write your message…"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
            />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                className="btn-primary"
                disabled={sendMessage.isPending}
                onClick={handleSend}
              >
                {sendMessage.isPending ? "Sending…" : "Send message"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
