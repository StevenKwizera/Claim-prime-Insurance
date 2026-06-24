import { ChangeEvent, useRef } from "react";
import { Download, RefreshCw, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { EvidenceThumbnail } from "@/components/evidence/EvidenceThumbnail";
import { useDeleteEvidence, useUploadEvidence } from "@/hooks/useClaims";
import { downloadStoredEvidence } from "@/services/backend";
import { ClaimDocument, ClaimType } from "@/types";
import { isImageDocument, isPdfDocument, isVideoDocument } from "@/utils/claimAccess";

type Props = {
  claimId: string;
  document: ClaimDocument;
  claimType?: ClaimType;
};

const acceptForDocument = (document: ClaimDocument) => {
  if (isImageDocument(document)) {
    return "image/*,.jpg,.jpeg,.png,.webp";
  }
  if (isVideoDocument(document)) {
    return "video/*,.mp4,.mov,.webm";
  }
  if (isPdfDocument(document)) {
    return ".pdf,application/pdf";
  }
  return "image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx";
};

export const EvidenceManageCard = ({ claimId, document, claimType }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const deleteEvidence = useDeleteEvidence();
  const uploadEvidence = useUploadEvidence();
  const busy = deleteEvidence.isPending || uploadEvidence.isPending;

  const handleDelete = () => {
    if (!window.confirm(`Remove "${document.name}" from this claim?`)) {
      return;
    }
    deleteEvidence.mutate(
      { claimId, documentId: document.id },
      {
        onSuccess: () => toast.success("Evidence removed."),
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : "Could not remove this file. Try again.")
      }
    );
  };

  const handleReplace = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
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

  const handleDownload = async () => {
    try {
      await downloadStoredEvidence(claimId, document.id, document.name);
    } catch {
      toast.error("Download failed.");
    }
  };

  return (
    <div className="space-y-2">
      <EvidenceThumbnail claimId={claimId} document={document} claimType={claimType} linkToClaim={false} />
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[0.68rem] font-semibold text-slate-700 transition hover:border-forest-300 hover:text-forest-800 disabled:opacity-50"
          disabled={busy}
          onClick={() => fileInputRef.current?.click()}
        >
          <RefreshCw className="h-3 w-3" />
          Replace
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[0.68rem] font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
          disabled={busy}
          onClick={handleDelete}
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[0.68rem] font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
          disabled={busy}
          onClick={() => void handleDownload()}
        >
          <Download className="h-3 w-3" />
          Download
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        className="sr-only"
        accept={acceptForDocument(document)}
        onChange={handleReplace}
      />
    </div>
  );
};
