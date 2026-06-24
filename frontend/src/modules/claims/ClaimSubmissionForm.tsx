import { FormEvent, useEffect, useMemo, useState } from "react";
import { useFormik } from "formik";
import { useDropzone } from "react-dropzone";
import * as Yup from "yup";
import toast from "react-hot-toast";
import { CheckCircle2, Circle, FileStack } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useClaim, useCreateClaim, useUpdateClaim } from "@/hooks/useClaims";
import { useClaimsStore } from "@/store/claimsStore";
import { ClaimType } from "@/types";
import { classifyUpload, detectFileKind, getDocumentChecklist, getRequiredDocuments } from "@/utils/documentAI";

const stepLabels = ["Basics", "Incident & narrative", "Evidence & AI check"];

const claimTypeFields: Record<ClaimType, Array<{ key: keyof FormValues; label: string }>> = {
  auto: [
    { key: "vehiclePlate", label: "Vehicle plate" },
    { key: "driverName", label: "Driver name" },
    { key: "accidentLocation", label: "Accident location" }
  ],
  health: [
    { key: "hospitalName", label: "Hospital name" },
    { key: "diagnosis", label: "Diagnosis" },
    { key: "admissionDate", label: "Admission date" }
  ],
  property: [
    { key: "propertyAddress", label: "Property address" },
    { key: "propertyIncidentType", label: "Incident type" },
    { key: "damageExtent", label: "Extent of damage" }
  ]
};

type FormValues = {
  claimType: ClaimType;
  claimantName: string;
  policyNumber: string;
  incidentDate: string;
  description: string;
  vehiclePlate: string;
  driverName: string;
  accidentLocation: string;
  hospitalName: string;
  diagnosis: string;
  admissionDate: string;
  propertyAddress: string;
  propertyIncidentType: string;
  damageExtent: string;
};

const baseInitialValues: FormValues = {
  claimType: "auto",
  claimantName: "",
  policyNumber: "AUTO-44390",
  incidentDate: new Date().toISOString().slice(0, 10),
  description: "Vehicle collision claim with repair estimate and police report attached.",
  vehiclePlate: "RAB 123A",
  driverName: "",
  accidentLocation: "Kigali",
  hospitalName: "",
  diagnosis: "",
  admissionDate: "",
  propertyAddress: "",
  propertyIncidentType: "",
  damageExtent: ""
};

function buildStep2Schema(type: ClaimType) {
  const description = Yup.string()
    .min(20, "Please provide more detail (at least 20 characters)")
    .required("Description is required");

  if (type === "auto") {
    return Yup.object({
      description,
      vehiclePlate: Yup.string().required("Vehicle plate is required"),
      driverName: Yup.string().required("Driver name is required"),
      accidentLocation: Yup.string().required("Accident location is required")
    });
  }
  if (type === "health") {
    return Yup.object({
      description,
      hospitalName: Yup.string().required("Hospital name is required"),
      diagnosis: Yup.string().required("Diagnosis is required"),
      admissionDate: Yup.string().required("Admission date is required")
    });
  }
  return Yup.object({
    description,
    propertyAddress: Yup.string().required("Property address is required"),
    propertyIncidentType: Yup.string().required("Incident type is required"),
    damageExtent: Yup.string().required("Extent of damage is required")
  });
}

const step1Schema = Yup.object({
  claimType: Yup.string().required(),
  claimantName: Yup.string().required("Claimant name is required"),
  policyNumber: Yup.string().required("Policy number is required"),
  incidentDate: Yup.string().required("Incident date is required")
});

function policyLookupPreview(policyNumber: string, claimantName: string) {
  const p = policyNumber.trim().toUpperCase();
  if (p.startsWith("AUTO") || p.includes("MOTOR")) {
    return {
      holder: claimantName,
      coverage: "Comprehensive motor — collision, theft, and third-party liability",
      period: "01 Jan 2026 – 31 Dec 2026",
      region: "National · Rwanda"
    };
  }
  if (p.startsWith("HLT") || p.startsWith("HEALTH")) {
    return {
      holder: claimantName,
      coverage: "Private health — inpatient and surgical benefits",
      period: "01 Jan 2026 – 31 Dec 2026",
      region: "Kigali metro network"
    };
  }
  if (p.startsWith("PRP") || p.startsWith("PROP")) {
    return {
      holder: claimantName,
      coverage: "Residential property — fire, flood, and structural damage",
      period: "01 Jan 2026 – 31 Dec 2026",
      region: "Western & Kigali"
    };
  }
  return {
    holder: claimantName,
    coverage: "Verify line of business in core policy systems",
    period: "Active policy window",
    region: "—"
  };
}

type Props = {
  claimId?: string;
};

export const ClaimSubmissionForm = ({ claimId }: Props) => {
  const isEditMode = Boolean(claimId);
  const { data: existingClaim } = useClaim(claimId ?? "");
  const [step, setStep] = useState(1);
  const [stepErrors, setStepErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [files, setFiles] = useState<File[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();
  const setLatestReference = useClaimsStore((state) => state.setLatestReference);
  const submitClaim = useCreateClaim("submit");
  const saveDraft = useCreateClaim("draft");
  const updateClaim = useUpdateClaim();

  const initialValues = useMemo(
    () => ({
      ...baseInitialValues,
      claimantName: user?.name ?? baseInitialValues.claimantName,
      driverName: user?.name ?? baseInitialValues.driverName
    }),
    [user?.name]
  );

  const buildPayload = () => ({
    claimType: formik.values.claimType,
    claimantName: formik.values.claimantName,
    policyNumber: formik.values.policyNumber,
    incidentDate: formik.values.incidentDate,
    description: formik.values.description,
    files: files.map((file) => ({
      name: file.name,
      kind: detectFileKind(file)
    })),
    fileBlobs: files
  });

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    onSubmit: async () => {
      try {
        if (isEditMode && claimId) {
          const claim = await updateClaim.mutateAsync({ claimId, payload: buildPayload() });
          toast.success(`Claim ${claim.id} updated.`);
          navigate(`/claims/${claim.id}`);
          return;
        }
        const claim = await submitClaim.mutateAsync(buildPayload());
        setLatestReference(claim.id);
        toast.success(`Claim ${claim.id} submitted successfully.`);
        navigate("/claims/confirmation");
      } catch {
        toast.error(isEditMode ? "Update failed. Try again." : "Submission failed. Make sure the backend server is running.");
      }
    }
  });

  useEffect(() => {
    if (!existingClaim) {
      return;
    }
    void formik.setValues({
      ...formik.values,
      claimType: existingClaim.type,
      claimantName: existingClaim.claimantName,
      policyNumber: existingClaim.policyNumber,
      description: existingClaim.aiSummary,
      incidentDate: existingClaim.submittedAt.slice(0, 10)
    });
  }, [existingClaim?.id]);

  const fields = useMemo(
    () => claimTypeFields[formik.values.claimType as ClaimType] ?? [],
    [formik.values.claimType]
  );

  const classificationResults = useMemo(
    () =>
      files.map((file) =>
        classifyUpload(file.name, file.type.includes("pdf") ? "pdf" : "image")
      ),
    [files]
  );

  const checklist = useMemo(
    () => getDocumentChecklist(formik.values.claimType as ClaimType, files.map((file) => file.name)),
    [files, formik.values.claimType]
  );

  const requiredDocuments = useMemo(
    () => getRequiredDocuments(formik.values.claimType as ClaimType),
    [formik.values.claimType]
  );

  const missingDocuments = checklist.filter((item) => item.status === "Missing");

  const policyPreview = useMemo(
    () => policyLookupPreview(formik.values.policyNumber, formik.values.claimantName),
    [formik.values.policyNumber, formik.values.claimantName]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".webp", ".gif"],
      "video/*": [".mp4", ".mov", ".webm", ".m4v"],
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"]
    },
    onDrop: (acceptedFiles) => setFiles((current) => [...current, ...acceptedFiles])
  });

  const mapValidationErrors = (err: Yup.ValidationError) => {
    const next: Partial<Record<keyof FormValues, string>> = {};
    for (const inner of err.inner) {
      if (inner.path && !next[inner.path as keyof FormValues]) {
        next[inner.path as keyof FormValues] = inner.message;
      }
    }
    if (!Object.keys(next).length && err.path) {
      next[err.path as keyof FormValues] = err.message;
    }
    setStepErrors(next);
    toast.error(err.errors[0] ?? "Please fix the highlighted fields.");
  };

  const goNext = async () => {
    setStepErrors({});
    try {
      if (step === 1) {
        await step1Schema.validate(formik.values, { abortEarly: false });
        setStep(2);
        return;
      }
      if (step === 2) {
        await buildStep2Schema(formik.values.claimType).validate(formik.values, { abortEarly: false });
        setStep(3);
      }
    } catch (err) {
      if (err instanceof Yup.ValidationError) {
        mapValidationErrors(err);
      }
    }
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step < 3) {
      void goNext();
      return;
    }
    void formik.submitForm();
  };

  const goBack = () => {
    setStepErrors({});
    setStep((current) => Math.max(1, current - 1));
  };

  const fieldError = (key: keyof FormValues) =>
    stepErrors[key] ? <p className="mt-1 text-xs text-rose-600">{stepErrors[key]}</p> : null;

  return (
    <div className="grid gap-8 xl:grid-cols-[1.4fr_0.6fr]">
      <form onSubmit={handleFormSubmit} className="card relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-prime-500 via-indigo-500 to-sky-400" />

        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-prime-600">Digital intake</p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex flex-1 items-center gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold shadow-sm transition ${
                    n < step
                      ? "bg-emerald-500 text-white"
                      : n === step
                        ? "bg-prime-600 text-white ring-4 ring-prime-100"
                        : "border border-slate-200 bg-white text-slate-400"
                  }`}
                >
                  {n < step ? <CheckCircle2 className="h-5 w-5" /> : n}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
                    Step {n}
                  </p>
                  <p className="truncate text-sm font-semibold text-slate-900">{stepLabels[n - 1]}</p>
                </div>
                {n < 3 ? (
                  <div className="hidden h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent sm:block" />
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {step === 1 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">Claim type</label>
              <select
                name="claimType"
                className="input"
                value={formik.values.claimType}
                onChange={formik.handleChange}
              >
                <option value="auto">Auto / motor</option>
                <option value="health">Health</option>
                <option value="property">Property</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Policy number</label>
              <input name="policyNumber" className="input" value={formik.values.policyNumber} onChange={formik.handleChange} />
              {fieldError("policyNumber")}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Claimant name</label>
              <input name="claimantName" className="input" value={formik.values.claimantName} onChange={formik.handleChange} />
              {fieldError("claimantName")}
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">Incident date</label>
              <input type="date" name="incidentDate" className="input" value={formik.values.incidentDate} onChange={formik.handleChange} />
              {fieldError("incidentDate")}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map((field) => (
              <div key={field.key} className={field.key === "description" ? "md:col-span-2" : ""}>
                <label className="mb-2 block text-sm font-medium text-slate-700">{field.label}</label>
                <input
                  name={field.key}
                  className="input"
                  value={formik.values[field.key] as string}
                  onChange={formik.handleChange}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  type={field.key === "admissionDate" ? "date" : "text"}
                />
                {fieldError(field.key)}
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">Full description</label>
              <textarea
                name="description"
                className="input min-h-36 resize-y"
                value={formik.values.description}
                onChange={formik.handleChange}
                placeholder="Describe what happened, parties involved, and immediate actions taken."
              />
              {fieldError("description")}
              <p className="mt-1 text-xs text-slate-500">{formik.values.description.length} characters · minimum 20</p>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-5">
            <div
              {...getRootProps()}
              className={`rounded-3xl border-2 border-dashed p-10 text-center transition ${
                isDragActive ? "border-prime-500 bg-prime-50/80" : "border-slate-200 bg-gradient-to-br from-slate-50 to-white"
              }`}
            >
              <input {...getInputProps()} />
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-prime-100 text-prime-700">
                <FileStack className="h-6 w-6" />
              </div>
              <p className="mt-4 text-base font-semibold text-slate-900">Drop documents here</p>
              <p className="mt-2 text-sm text-slate-500">
                Police abstracts, medical notes, invoices, photos — PDF or images.
              </p>
            </div>
            <div className="space-y-2">
              {files.length === 0 ? (
                <p className="text-sm text-slate-500">No files uploaded yet. You can still submit; officers may request documents later.</p>
              ) : null}
              {files.map((file) => (
                <div
                  key={`${file.name}-${file.size}`}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm"
                >
                  <span className="truncate font-medium">{file.name}</span>
                  <span className="shrink-0 text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</span>
                </div>
              ))}
            </div>
            {classificationResults.length > 0 ? (
              <div className="rounded-3xl border border-prime-100 bg-prime-50/40 p-5">
                <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-prime-700">AI document intake</h4>
                <div className="mt-4 space-y-3">
                  {classificationResults.map((result) => (
                    <div key={result.name} className="rounded-2xl border border-white bg-white/90 p-4 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{result.name}</p>
                          <p className="mt-1 text-sm text-slate-600">Detected: {result.documentType}</p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              result.aiStatus === "Valid"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {result.aiStatus}
                          </span>
                          <p className="mt-2 text-xs font-medium text-slate-500">Confidence {result.confidenceScore}%</p>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-slate-500">{result.reviewNote}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-10 flex flex-wrap justify-between gap-4 border-t border-slate-100 pt-6">
          {!isEditMode ? (
            <button
              type="button"
              className="btn-secondary"
              disabled={saveDraft.isPending}
              onClick={() => {
                saveDraft.mutate(buildPayload(), {
                  onSuccess: (claim) => {
                    setLatestReference(claim.id);
                    toast.success(`Draft ${claim.id} saved.`);
                    navigate("/claims/drafts");
                  },
                  onError: () => {
                    toast.error("Draft save failed. Make sure the backend server is running.");
                  }
                });
              }}
            >
              {saveDraft.isPending ? "Saving…" : "Save as draft"}
            </button>
          ) : (
            <button type="button" className="btn-secondary" onClick={() => navigate(`/claims/${claimId}`)}>
              Cancel edit
            </button>
          )}
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-secondary" onClick={goBack} disabled={step === 1}>
              Back
            </button>
            {step < 3 ? (
              <button type="button" className="btn-primary min-w-[8rem]" onClick={() => void goNext()}>
                Continue
              </button>
            ) : (
              <button type="submit" className="btn-primary min-w-[10rem]" disabled={submitClaim.isPending || updateClaim.isPending}>
                {isEditMode
                  ? updateClaim.isPending
                    ? "Saving…"
                    : "Save changes"
                  : submitClaim.isPending
                    ? "Submitting…"
                    : "Submit claim"}
              </button>
            )}
          </div>
        </div>
      </form>

      <div className="space-y-6">
        <div className="card border-prime-100 bg-gradient-to-br from-white to-prime-50/30 p-6">
          <div className="flex items-center gap-2">
            <Circle className="h-4 w-4 text-prime-500" />
            <h3 className="text-lg font-bold text-slate-900">Policy lookup</h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">Simulated auto-fill from policy database (by policy prefix).</p>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Policy holder</p>
              <p className="mt-1 font-semibold text-slate-900">{policyPreview.holder}</p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Coverage</p>
              <p className="mt-1 leading-relaxed">{policyPreview.coverage}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Active period</p>
                <p className="mt-1 font-medium text-slate-800">{policyPreview.period}</p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Region</p>
                <p className="mt-1 font-medium text-slate-800">{policyPreview.region}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-bold text-slate-900">Required documents</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            {requiredDocuments.map((document) => {
              const matched = checklist.find((item) => item.type === document);
              return (
                <div key={document} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span>{document}</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      matched?.status === "Uploaded"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {matched?.status ?? "Missing"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-bold text-slate-900">AI verification summary</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Detected uploads</p>
              <p className="mt-1">{classificationResults.length} file(s) classified.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Missing requirements</p>
              <p className="mt-1">
                {missingDocuments.length === 0
                  ? "No required documents flagged as missing."
                  : missingDocuments.map((item) => item.type).join(", ")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
