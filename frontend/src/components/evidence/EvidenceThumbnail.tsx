import { useEffect, useState } from "react";
import { FileText, Film, ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchEvidenceBlob } from "@/services/backend";
import { ClaimDocument, ClaimType } from "@/types";
import { isImageDocument, isVideoDocument } from "@/utils/claimAccess";
import { resolveEvidencePreviewUrl } from "@/utils/evidencePreview";
import { formatDate } from "@/utils/format";

type Props = {
  claimId: string;
  document: ClaimDocument;
  claimType?: ClaimType;
  showMeta?: boolean;
  linkToClaim?: boolean;
};

export const EvidenceThumbnail = ({
  claimId,
  document,
  claimType,
  showMeta = true,
  linkToClaim = true
}: Props) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const isImage = isImageDocument(document);
  const isVideo = isVideoDocument(document);
  const thematicFallback = resolveEvidencePreviewUrl(claimId, document, claimType);
  const hasStoredFile = Boolean(document.storageKey?.trim());

  useEffect(() => {
    if (!isImage && !isVideo) {
      return;
    }

    let active = true;
    let objectUrl: string | null = null;

    const applyThematicFallback = () => {
      if (!active || !thematicFallback) {
        if (active) {
          setFailed(true);
        }
        return;
      }
      setPreviewUrl(thematicFallback);
      setFailed(false);
    };

    const loadPreview = async () => {
      setLoading(true);
      setFailed(false);

      if (hasStoredFile) {
        try {
          const blob = await fetchEvidenceBlob(claimId, document.id);
          if (!active) {
            return;
          }
          if (blob.size > 0) {
            objectUrl = URL.createObjectURL(blob);
            setPreviewUrl(objectUrl);
            setLoading(false);
            return;
          }
        } catch {
          // fall through to thematic preview
        }
      }

      if (!active) {
        return;
      }

      if (thematicFallback) {
        setPreviewUrl(thematicFallback);
        setFailed(false);
      } else {
        setFailed(true);
      }
      setLoading(false);
    };

    void loadPreview();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [claimId, document.id, document.storageKey, hasStoredFile, isImage, isVideo, thematicFallback]);

  const handleMediaError = () => {
    if (thematicFallback && previewUrl !== thematicFallback) {
      setPreviewUrl(thematicFallback);
      setFailed(false);
      return;
    }
    setFailed(true);
  };

  const claimTypeLabel =
    claimType === "auto"
      ? "Motor / accident"
      : claimType === "health"
        ? "Health / medical"
        : claimType === "property"
          ? "Property damage"
          : null;

  const body = (
    <div className="overflow-hidden rounded-2xl border border-forest-200/70 bg-white shadow-sm transition hover:border-forest-300 hover:shadow-md">
      <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-100 to-emerald-50/40">
        {claimTypeLabel ? (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-forest-800/85 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide text-emerald-50">
            {claimTypeLabel}
          </span>
        ) : null}
        {loading ? (
          <div className="grid h-full place-items-center text-xs font-medium text-slate-500">Loading photo…</div>
        ) : previewUrl && !failed && isVideo ? (
          <video
            src={previewUrl}
            className="h-full w-full object-cover"
            controls
            muted
            playsInline
            onError={handleMediaError}
          />
        ) : previewUrl && !failed ? (
          <img
            src={previewUrl}
            alt={document.name}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={handleMediaError}
          />
        ) : (
          <div className="grid h-full place-items-center text-slate-500">
            {document.kind === "pdf" || document.kind === "document" ? (
              <FileText className="h-10 w-10" />
            ) : isVideo ? (
              <Film className="h-10 w-10" />
            ) : (
              <div className="px-3 text-center">
                <ImageIcon className="mx-auto h-8 w-8 opacity-60" />
                <p className="mt-2 text-xs font-medium">Preview unavailable</p>
              </div>
            )}
          </div>
        )}
      </div>
      {showMeta ? (
        <div className="border-t border-forest-100/80 bg-white p-3">
          <p className="truncate text-sm font-semibold text-forest-900">{document.name}</p>
          <p className="mt-1 text-xs text-slate-500">
            {document.documentType ?? document.kind.toUpperCase()} · {formatDate(document.uploadedAt)}
          </p>
        </div>
      ) : null}
    </div>
  );

  if (linkToClaim) {
    return (
      <Link to={`/claims/${claimId}`} className="block transition hover:opacity-95">
        {body}
      </Link>
    );
  }

  return body;
};
