import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Car, ClipboardList, HeartPulse, Home, MailCheck, Send } from "lucide-react";
import { MetricCard, MetricCardGrid } from "@/components/MetricCard";
import { SectionCard } from "@/components/SectionCard";
import { PROJECT_EVIDENCE } from "@/config/evidenceMedia";
import { useAuth } from "@/hooks/useAuth";
import { useClaimAction, useClaims } from "@/hooks/useClaims";
import { useI18n } from "@/i18n/LanguageContext";
import { TranslationKey } from "@/i18n/translations";
import { Claim, ClaimType } from "@/types";
import { downloadCsv } from "@/utils/download";

const TYPE_VISUALS: Record<
  ClaimType,
  { image: string; icon: typeof Car; variant: "forest" | "emerald" | "gold"; labelKey: TranslationKey; hintKey: TranslationKey; templateKey: TranslationKey }
> = {
  auto: {
    image: PROJECT_EVIDENCE.images.autoScene,
    icon: Car,
    variant: "forest",
    labelKey: "missing.previewAuto",
    hintKey: "missing.autoHint",
    templateKey: "missing.templateAuto"
  },
  health: {
    image: PROJECT_EVIDENCE.images.healthWard,
    icon: HeartPulse,
    variant: "emerald",
    labelKey: "missing.previewHealth",
    hintKey: "missing.healthHint",
    templateKey: "missing.templateHealth"
  },
  property: {
    image: PROJECT_EVIDENCE.images.propertyFloodRoom,
    icon: Home,
    variant: "gold",
    labelKey: "missing.previewProperty",
    hintKey: "missing.propertyHint",
    templateKey: "missing.templateProperty"
  }
};

function EvidenceTypeCard({
  type,
  active,
  onSelect
}: {
  type: ClaimType;
  active: boolean;
  onSelect: () => void;
}) {
  const { t } = useI18n();
  const visual = TYPE_VISUALS[type];
  const Icon = visual.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group overflow-hidden rounded-2xl border text-left transition ${
        active
          ? "border-forest-500 shadow-[0_12px_32px_rgba(27,67,50,0.18)] ring-2 ring-forest-400/40"
          : "border-forest-200/70 hover:border-forest-300 hover:shadow-md"
      }`}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-forest-950">
        <img src={visual.image} alt="" className="h-full w-full object-cover opacity-90 transition group-hover:scale-[1.02]" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950/80 via-forest-900/20 to-transparent" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-forest-800/90 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-emerald-50">
          <Icon className="h-3.5 w-3.5" />
          {t(visual.labelKey)}
        </span>
      </div>
      <div className="bg-white px-3 py-3">
        <p className="text-xs leading-relaxed text-slate-600">{t(visual.hintKey)}</p>
      </div>
    </button>
  );
}

export const MissingDocumentsRequestPage = () => {
  const { t, language } = useI18n();
  const { data: claims = [] } = useClaims();
  const claimAction = useClaimAction();
  const { user } = useAuth();
  const reviewQueue = claims.filter((c) => ["Pending", "Under Review"].includes(c.status));
  const [claimId, setClaimId] = useState(reviewQueue[0]?.id ?? "");
  const selectedClaim = reviewQueue.find((c) => c.id === claimId);
  const [message, setMessage] = useState("");

  const pendingDocCount = useMemo(
    () => reviewQueue.reduce((sum, claim) => sum + claim.documents.filter((d) => d.aiStatus !== "Valid").length, 0),
    [reviewQueue]
  );

  useEffect(() => {
    if (!selectedClaim) {
      setMessage("");
      return;
    }
    setMessage(t(TYPE_VISUALS[selectedClaim.type].templateKey));
  }, [selectedClaim?.id, selectedClaim?.type, language, t]);

  useEffect(() => {
    if (!claimId && reviewQueue[0]?.id) {
      setClaimId(reviewQueue[0].id);
    }
  }, [claimId, reviewQueue]);

  const sendRequest = () => {
    if (!claimId) {
      toast.error(t("missing.toastSelectClaim"));
      return;
    }
    claimAction.mutate(
      { claimId, action: "request-info", actor: user?.name ?? "Officer", message },
      {
        onSuccess: () => toast.success(t("missing.toastSent")),
        onError: () => toast.error(t("missing.toastError"))
      }
    );
  };

  const applyTemplate = (type: ClaimType) => {
    setMessage(t(TYPE_VISUALS[type].templateKey));
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-forest-600/25 bg-gradient-to-br from-forest-800 via-forest-900 to-forest-950 px-5 py-6 text-white shadow-[0_18px_50px_rgba(10,31,23,0.28)] sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/4 h-32 w-32 rounded-full bg-teal-300/10 blur-2xl" />
        <div className="relative max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200/90">{t("missing.eyebrow")}</p>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">{t("missing.title")}</h1>
          <p className="mt-3 text-sm leading-relaxed text-emerald-100/75 sm:text-[0.95rem]">{t("missing.description")}</p>
        </div>
      </section>

      <div className="dashboard-stat-band">
        <MetricCardGrid columns={3}>
          <MetricCard
            title={t("missing.queueOpen")}
            value={String(reviewQueue.length)}
            detail={t("missing.builderHint")}
            icon={ClipboardList}
            variant="forest"
          />
          <MetricCard
            title={t("missing.pendingDocs")}
            value={String(pendingDocCount)}
            detail={t("missing.previewTitle")}
            icon={MailCheck}
            variant="amber"
          />
          <MetricCard
            title={t("missing.claimantsNotified")}
            value={selectedClaim ? "1" : "0"}
            detail={selectedClaim ? selectedClaim.claimantName : t("missing.noClaims")}
            icon={Send}
            variant="teal"
          />
        </MetricCardGrid>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <SectionCard title={t("missing.builderTitle")} description={t("missing.builderHint")}>
            {reviewQueue.length === 0 ? (
              <p className="text-sm text-slate-500">{t("missing.noClaims")}</p>
            ) : (
              <>
                <label className="block text-xs font-bold uppercase tracking-wide text-forest-700">{t("missing.claimLabel")}</label>
                <select className="input mt-2 max-w-full border-forest-200 focus:border-forest-500 focus:ring-forest-100" value={claimId} onChange={(e) => setClaimId(e.target.value)}>
                  {reviewQueue.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} — {c.claimantName} ({c.status})
                    </option>
                  ))}
                </select>

                <label className="mt-5 block text-xs font-bold uppercase tracking-wide text-forest-700">{t("missing.messageLabel")}</label>
                <textarea
                  className="input mt-2 min-h-40 border-forest-200 focus:border-forest-500 focus:ring-forest-100"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />

                <div className="mt-4 flex flex-wrap gap-3">
                  <button type="button" className="btn-primary" onClick={sendRequest} disabled={claimAction.isPending}>
                    {claimAction.isPending ? t("common.loading") : t("missing.sendRequest")}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary border-forest-200 text-forest-800 hover:border-forest-300 hover:bg-forest-50"
                    onClick={() => downloadCsv(`missing-documents-${Date.now()}.csv`, [{ claimId, message }])}
                  >
                    {t("missing.downloadCsv")}
                  </button>
                </div>
              </>
            )}
          </SectionCard>
        </div>

        <aside className="space-y-4 xl:col-span-5">
          <SectionCard title={t("missing.templatesTitle")}>
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {(["auto", "health", "property"] as ClaimType[]).map((type) => (
                <EvidenceTypeCard
                  key={type}
                  type={type}
                  active={selectedClaim?.type === type}
                  onSelect={() => applyTemplate(type)}
                />
              ))}
            </div>
          </SectionCard>

          {selectedClaim ? (
            <SelectedClaimSummary claim={selectedClaim} />
          ) : null}
        </aside>
      </div>
    </div>
  );
};

function SelectedClaimSummary({ claim }: { claim: Claim }) {
  const { t } = useI18n();
  const visual = TYPE_VISUALS[claim.type];

  return (
    <div className="overflow-hidden rounded-2xl border border-forest-200/70 bg-white shadow-sm">
      <div className="relative h-36 overflow-hidden">
        <img src={visual.image} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950/75 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-sm font-bold text-white">{claim.id}</p>
          <p className="text-xs text-emerald-100/85">{claim.claimantName} · {t(visual.labelKey)}</p>
        </div>
      </div>
      <div className="space-y-2 p-4 text-sm text-slate-600">
        <p>
          <span className="font-semibold text-forest-900">{claim.documents.length}</span> files uploaded
        </p>
        <p>{t(visual.hintKey)}</p>
      </div>
    </div>
  );
}
