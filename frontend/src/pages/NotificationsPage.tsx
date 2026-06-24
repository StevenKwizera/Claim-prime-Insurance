import { PageHeader } from "@/components/PageHeader";
import { useCreateNotification, useMarkNotificationRead, useNotifications } from "@/hooks/useClaims";
import { extractClaimId } from "@/utils/claimId";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const TEMPLATES = [
  {
    title: "Additional document required",
    body: "Please upload the missing supporting document for your claim.",
    status: "Action Needed" as const
  },
  {
    title: "Claim approved",
    body: "Your claim has been approved. See your claim timeline for next steps.",
    status: "Unread" as const
  },
  {
    title: "Fraud review escalation",
    body: "Your claim requires additional fraud review. An investigator will contact you if needed.",
    status: "Unread" as const
  }
];

export const NotificationsPage = () => {
  const { data = [] } = useNotifications();
  const markRead = useMarkNotificationRead();
  const createNotification = useCreateNotification();

  const sendTemplate = (template: (typeof TEMPLATES)[0]) => {
    createNotification.mutate(template, {
      onSuccess: () => toast.success(`"${template.title}" added to the notification center.`),
      onError: () => toast.error("Could not create notification.")
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Notifications Center"
        title="Inbox, templates, and delivery tracking"
        description="Manage claim communications. Templates create real in-app notifications stored in the database."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link to="/messages" className="btn-secondary">
              Direct messages
            </Link>
            <Link to="/notifications/templates" className="btn-secondary">
              Templates
            </Link>
            <Link to="/notifications/scheduler" className="btn-secondary">
              Scheduler
            </Link>
            <Link to="/notifications/delivery" className="btn-primary">
              Delivery
            </Link>
          </div>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="card p-6">
          <h3 className="text-xl font-bold text-navy-900">Inbox</h3>
          <div className="mt-4 space-y-3">
            {data.map((item) => {
              const claimRef = extractClaimId(`${item.title} ${item.body}`);
              return (
              <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-navy-900">{item.title}</p>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{item.status}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{item.body}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.status !== "Read" ? (
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={markRead.isPending}
                      onClick={() =>
                        markRead.mutate(item.id, {
                          onSuccess: () => toast.success("Marked as read."),
                          onError: () => toast.error("Could not update notification.")
                        })
                      }
                    >
                      Mark read
                    </button>
                  ) : null}
                  {item.status === "Action Needed" && claimRef ? (
                    <Link to={`/evidence/upload?claimId=${encodeURIComponent(claimRef)}`} className="btn-primary">
                      Upload evidence for {claimRef}
                    </Link>
                  ) : null}
                  {claimRef ? (
                    <Link to={`/claims/${claimRef}`} className="btn-secondary">
                      View claim
                    </Link>
                  ) : null}
                </div>
              </div>
            );
            })}
          </div>
        </div>
        <div className="card p-6">
          <h3 className="text-xl font-bold text-navy-900">Message templates</h3>
          <p className="mt-2 text-sm text-slate-500">Click a template to publish it to the notification center.</p>
          <div className="mt-4 space-y-3">
            {TEMPLATES.map((template) => (
              <button
                key={template.title}
                type="button"
                className="action-tile w-full text-left"
                disabled={createNotification.isPending}
                onClick={() => sendTemplate(template)}
              >
                <span>{template.title}</span>
                <span className="text-xs text-prime-700">Send</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
