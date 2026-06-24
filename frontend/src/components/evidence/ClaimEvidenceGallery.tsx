import { ChangeEvent, useRef } from "react";
import { Download, FileText, Film, RefreshCw, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { EvidenceManageCard } from "@/components/evidence/EvidenceManageCard";
import { EvidenceThumbnail } from "@/components/evidence/EvidenceThumbnail";
import { useDeleteEvidence, useUploadEvidence } from "@/hooks/useClaims";
import { downloadStoredEvidence } from "@/services/backend";
import { Claim, ClaimDocument, ClaimType } from "@/types";
import { isImageDocument, isPdfDocument, isVideoDocument } from "@/utils/claimAccess";
import { formatDate } from "@/utils/format";

type Props = {
  claimId: string;
  claimType?: ClaimType;
  documents: ClaimDocument[];
  title?: string;
  emptyMessage?: string;
  showPdfList?: boolean;
  manageable?: boolean;
};

function DocumentRowActions({
  claimId,
  document,
  busy,
  onDelete,
  onReplace
}: {
  claimId: string;
  document: ClaimDocument;
  busy: boolean;
  onDelete: () => void;
  onReplace: (file: File) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReplace = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) {
      onReplace(file);
    }
  };

  return (
    <div className="flex shrink-0 flex-wrap gap-1">
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[0.68rem] font-semibold text-slate-600 hover:border-forest-300 disabled:opacity-50"
        disabled={busy}
        onClick={() => fileInputRef.current?.click()}
      >
        <RefreshCw className="h-3 w-3" />
        Replace
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[0.68rem] font-semibold text-rose-700 disabled:opacity-50"
        disabled={busy}
        onClick={onDelete}
      >
        <Trash2 className="h-3 w-3" />
        Delete
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[0.68rem] font-semibold text-slate-600 disabled:opacity-50"
        disabled={busy}
        onClick={() => void downloadStoredEvidence(claimId, document.id, document.name).catch(() => toast.error("Download failed."))}
      >
        <Download className="h-3 w-3" />
      </button>
      <input ref={fileInputRef} type="file" className="sr-only" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={handleReplace} />
    </div>
  );
}

export const ClaimEvidenceGallery = ({
  claimId,
  claimType,
  documents,
  title = "All photos, videos & documents",
  emptyMessage = "No files uploaded yet.",
  showPdfList = true,
  manageable = false
}: Props) => {
  const deleteEvidence = useDeleteEvidence();
  const uploadEvidence = useUploadEvidence();
  const busy = deleteEvidence.isPending || uploadEvidence.isPending;

  const images = documents.filter((doc) => isImageDocument(doc));
  const videos = documents.filter((doc) => isVideoDocument(doc));
  const pdfs = documents.filter((doc) => isPdfDocument(doc));
  const otherDocs = documents.filter((doc) => !isImageDocument(doc) && !isVideoDocument(doc) && !isPdfDocument(doc));

  const handleDelete = (document: ClaimDocument) => {
    if (!window.confirm(`Remove "${document.name}" from this claim?`)) {
      return;
    }
    deleteEvidence.mutate(
      { claimId, documentId: document.id },
      {
        onSuccess: () => toast.success("Evidence removed."),
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : "Could not remove this file.")
      }
    );
  };

  const handleReplace = (document: ClaimDocument, file: File) => {
    uploadEvidence.mutate(
      { claimId, files: [file] },
      {
        onSuccess: () => {
          deleteEvidence.mutate(
            { claimId, documentId: document.id },
            {
              onSuccess: () => toast.success("Evidence updated."),
              onError: () => toast.error("New file saved, but the old copy could not be removed.")
            }
          );
        },
        onError: () => toast.error("Could not upload the replacement file.")
      }
    );
  };

  if (!documents.length) {
    return <p className="text-sm text-slate-500">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
        <span className="text-xs font-medium text-slate-500">
          {documents.length} file{documents.length === 1 ? "" : "s"} · {images.length} photo
          {images.length === 1 ? "" : "s"}, {videos.length} video{videos.length === 1 ? "" : "s"},{" "}
          {pdfs.length + otherDocs.length} document{pdfs.length + otherDocs.length === 1 ? "" : "s"}
        </span>
      </div>

      {images.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Photos</p>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {images.map((doc) =>
              manageable ? (
                <EvidenceManageCard key={doc.id} claimId={claimId} claimType={claimType} document={doc} />
              ) : (
                <EvidenceThumbnail key={doc.id} claimId={claimId} claimType={claimType} document={doc} linkToClaim={false} />
              )
            )}
          </div>
        </div>
      ) : null}

      {videos.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Videos</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((doc) =>
              manageable ? (
                <EvidenceManageCard key={doc.id} claimId={claimId} claimType={claimType} document={doc} />
              ) : (
                <EvidenceThumbnail key={doc.id} claimId={claimId} claimType={claimType} document={doc} linkToClaim={false} />
              )
            )}
          </div>
        </div>
      ) : null}

      {showPdfList && (pdfs.length > 0 || otherDocs.length > 0) ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">PDFs & other files</p>
          <ul className="space-y-2">
            {[...pdfs, ...otherDocs].map((doc) => (
              <li
                key={doc.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              >
                {isVideoDocument(doc) ? (
                  <Film className="h-5 w-5 shrink-0 text-slate-500" />
                ) : (
                  <FileText className="h-5 w-5 shrink-0 text-slate-500" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{doc.name}</p>
                  <p className="text-xs text-slate-500">
                    {(doc.documentType ?? doc.kind).toUpperCase()} · {formatDate(doc.uploadedAt)}
                  </p>
                </div>
                {manageable ? (
                  <DocumentRowActions
                    claimId={claimId}
                    document={doc}
                    busy={busy}
                    onDelete={() => handleDelete(doc)}
                    onReplace={(file) => handleReplace(doc, file)}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export function allClaimDocuments(claims: Claim[]) {
  return claims.flatMap((claim) =>
    claim.documents.map((doc) => ({ claimId: claim.id, claimStatus: claim.status, claimType: claim.type, ...doc }))
  );
}
