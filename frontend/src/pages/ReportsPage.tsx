import { useEffect, useMemo, useState } from "react";
import {
  CalendarRange,
  Eye,
  FileDown,
  FileSpreadsheet,
  Files,
  Search,
  Sparkles,
  TrendingUp
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { MetricCard, MetricCardGrid } from "@/components/MetricCard";
import primeLogo from "@/logo prime.jpeg";
import { REPORT_CATALOG, ReportCatalogEntry, ReportKind, findReport } from "@/config/reportCatalog";
import { useAuth } from "@/hooks/useAuth";
import { useClaims } from "@/hooks/useClaims";
import {
  buildReportCsvContent,
  buildReportPdfBlob,
  downloadReportCsv,
  downloadReportPdf
} from "@/utils/reportExport";
import {
  buildReportPreviewTable,
  formatPeriodLabel,
  getDefaultDateRange,
  resolveReportClaims
} from "@/utils/reportData";

type ExportFormat = "pdf" | "csv";

type ReportAccent = {
  ring: string;
  icon: string;
  badge: string;
  chip: string;
};

const REPORT_ACCENTS: Record<ReportKind, ReportAccent> = {
  portfolio: {
    ring: "ring-forest-400/50",
    icon: "bg-forest-700 text-emerald-50",
    badge: "bg-forest-100 text-forest-800",
    chip: "text-forest-700"
  },
  approved: {
    ring: "ring-emerald-400/50",
    icon: "bg-emerald-600 text-white",
    badge: "bg-emerald-100 text-emerald-800",
    chip: "text-emerald-700"
  },
  pending: {
    ring: "ring-amber-400/50",
    icon: "bg-amber-500 text-white",
    badge: "bg-amber-100 text-amber-800",
    chip: "text-amber-700"
  },
  rejected: {
    ring: "ring-rose-400/50",
    icon: "bg-rose-500 text-white",
    badge: "bg-rose-100 text-rose-800",
    chip: "text-rose-700"
  },
  fraud: {
    ring: "ring-orange-400/50",
    icon: "bg-orange-600 text-white",
    badge: "bg-orange-100 text-orange-800",
    chip: "text-orange-700"
  },
  investigation: {
    ring: "ring-violet-400/50",
    icon: "bg-violet-600 text-white",
    badge: "bg-violet-100 text-violet-800",
    chip: "text-violet-700"
  },
  auto: {
    ring: "ring-blue-400/50",
    icon: "bg-blue-600 text-white",
    badge: "bg-blue-100 text-blue-800",
    chip: "text-blue-700"
  },
  health: {
    ring: "ring-teal-400/50",
    icon: "bg-teal-600 text-white",
    badge: "bg-teal-100 text-teal-800",
    chip: "text-teal-700"
  },
  property: {
    ring: "ring-gold-400/50",
    icon: "bg-gold-600 text-white",
    badge: "bg-amber-100 text-amber-900",
    chip: "text-gold-700"
  },
  evidence: {
    ring: "ring-cyan-400/50",
    icon: "bg-cyan-600 text-white",
    badge: "bg-cyan-100 text-cyan-800",
    chip: "text-cyan-700"
  },
  "officer-workload": {
    ring: "ring-indigo-400/50",
    icon: "bg-indigo-600 text-white",
    badge: "bg-indigo-100 text-indigo-800",
    chip: "text-indigo-700"
  },
  regional: {
    ring: "ring-lime-400/50",
    icon: "bg-lime-600 text-white",
    badge: "bg-lime-100 text-lime-800",
    chip: "text-lime-800"
  },
  claim: {
    ring: "ring-forest-400/50",
    icon: "bg-forest-600 text-white",
    badge: "bg-forest-100 text-forest-800",
    chip: "text-forest-700"
  }
};

const FILTER_TABS = [
  { id: "all", label: "All reports" },
  { id: "status", label: "Status & risk" },
  { id: "type", label: "Claim types" },
  { id: "ops", label: "Operations" }
] as const;

type FilterTab = (typeof FILTER_TABS)[number]["id"];

function reportMatchesFilter(entry: ReportCatalogEntry, tab: FilterTab) {
  if (tab === "all") {
    return true;
  }
  if (tab === "status") {
    return ["approved", "pending", "rejected", "fraud", "investigation"].includes(entry.id);
  }
  if (tab === "type") {
    return ["auto", "health", "property"].includes(entry.id);
  }
  return ["portfolio", "evidence", "officer-workload", "regional", "claim"].includes(entry.id);
}

export const ReportsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: claims = [], isLoading } = useClaims();
  const { user } = useAuth();

  const initialReport = findReport(searchParams.get("report"))?.id ?? "portfolio";
  const [selectedId, setSelectedId] = useState<ReportKind>(initialReport);
  const [format, setFormat] = useState<ExportFormat>(
    searchParams.get("format") === "csv" ? "csv" : "pdf"
  );
  const [reportTitle, setReportTitle] = useState("");
  const [claimId, setClaimId] = useState(searchParams.get("claimId") ?? "");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [csvPreview, setCsvPreview] = useState<string>("");
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");

  const selected = useMemo(() => findReport(selectedId) ?? REPORT_CATALOG[0], [selectedId]);
  const accent = REPORT_ACCENTS[selectedId];

  useEffect(() => {
    if (claims.length && !dateFrom && !dateTo) {
      const defaults = getDefaultDateRange(claims);
      setDateFrom(defaults.from);
      setDateTo(defaults.to);
    }
  }, [claims, dateFrom, dateTo]);

  useEffect(() => {
    setReportTitle(selected.defaultTitle);
    if (!selected.supportsCsv && format === "csv") {
      setFormat("pdf");
    }
    setPreviewReady(false);
    setCsvPreview("");
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl(null);
    }
  }, [selected.id, selected.defaultTitle, selected.supportsCsv, format]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("report", selectedId);
    if (format === "csv") {
      params.set("format", "csv");
    }
    if (selectedId === "claim" && claimId) {
      params.set("claimId", claimId);
    }
    setSearchParams(params, { replace: true });
  }, [selectedId, format, claimId, setSearchParams]);

  const periodLabel = dateFrom && dateTo ? formatPeriodLabel(dateFrom, dateTo) : "—";
  const filteredClaims = useMemo(() => {
    if (!dateFrom || !dateTo) {
      return [];
    }
    return resolveReportClaims(claims, selectedId, dateFrom, dateTo);
  }, [claims, selectedId, dateFrom, dateTo]);

  const claimsForPicker = useMemo(() => {
    if (!dateFrom || !dateTo) {
      return claims;
    }
    return resolveReportClaims(claims, "portfolio", dateFrom, dateTo);
  }, [claims, dateFrom, dateTo]);

  const visibleReports = useMemo(() => {
    const query = search.trim().toLowerCase();
    return REPORT_CATALOG.filter((entry) => {
      if (!reportMatchesFilter(entry, filterTab)) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        entry.title.toLowerCase().includes(query) ||
        entry.code.toLowerCase().includes(query) ||
        entry.description.toLowerCase().includes(query)
      );
    });
  }, [search, filterTab]);

  const previewTable = useMemo(
    () => buildReportPreviewTable(filteredClaims, selectedId, periodLabel),
    [filteredClaims, selectedId, periodLabel]
  );

  const meta = () => ({
    title: reportTitle.trim() || selected.defaultTitle,
    generatedBy: user?.name ?? "System user",
    generatedByRole: user?.role ?? "staff",
    generatedAt: new Date()
  });

  const buildInput = () => ({
    kind: selectedId,
    allClaims: claims,
    dateFrom,
    dateTo,
    claimId,
    meta: meta()
  });

  const validate = (): boolean => {
    if (isLoading) {
      toast.error("Claims are still loading. Please wait.");
      return false;
    }
    if (!dateFrom || !dateTo) {
      toast.error("Select a date range for the report.");
      return false;
    }
    if (new Date(dateFrom) > new Date(dateTo)) {
      toast.error("Start date must be before end date.");
      return false;
    }
    if (selected.needsClaimPick && !claimId) {
      toast.error("Pick a claim for the single-claim dossier report.");
      return false;
    }
    if (selectedId !== "claim" && filteredClaims.length === 0) {
      toast.error("No claims match this report and date range.");
      return false;
    }
    return true;
  };

  const handlePreview = async () => {
    if (!validate()) {
      return;
    }
    setBusy(true);
    try {
      if (format === "csv") {
        setCsvPreview(buildReportCsvContent(buildInput()));
        if (pdfPreviewUrl) {
          URL.revokeObjectURL(pdfPreviewUrl);
          setPdfPreviewUrl(null);
        }
      } else {
        const blob = await buildReportPdfBlob(buildInput());
        const url = URL.createObjectURL(blob);
        if (pdfPreviewUrl) {
          URL.revokeObjectURL(pdfPreviewUrl);
        }
        setPdfPreviewUrl(url);
        setCsvPreview("");
      }
      setPreviewReady(true);
      toast.success("Report preview ready.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Preview failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = async () => {
    if (!validate()) {
      return;
    }
    setBusy(true);
    try {
      if (format === "csv") {
        downloadReportCsv(buildInput());
        toast.success("CSV downloaded.");
      } else {
        await downloadReportPdf(buildInput());
        toast.success("PDF report downloaded.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setBusy(false);
    }
  };

  const totalEvidence = claims.reduce((sum, claim) => sum + claim.documents.length, 0);
  const todayLabel = new Date().toLocaleDateString("en-GB");

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-forest-300/40 bg-gradient-to-br from-forest-600 via-forest-700 to-emerald-800 px-5 py-5 text-white shadow-[0_16px_48px_rgba(27,67,50,0.22)] sm:px-7 sm:py-6">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-300/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-28 w-28 rounded-full bg-teal-300/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100/90">
              <Sparkles className="h-3.5 w-3.5" />
              Reports center
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Choose a report, preview, then download</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-emerald-50/85">
              Branded PDFs and CSV exports with Prime Insurance header, your name, date range, and live claim data.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur">
              <Files className="h-3.5 w-3.5" />
              {REPORT_CATALOG.length} report types
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur">
              <TrendingUp className="h-3.5 w-3.5" />
              {claims.length} claims in system
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-stat-band">
        <MetricCardGrid columns={4}>
          <MetricCard
            title="Report types"
            value={String(REPORT_CATALOG.length)}
            detail="Portfolio, status, evidence & more"
            icon={Files}
            variant="forest"
            trend={{ label: "Full catalog", direction: "neutral" }}
          />
          <MetricCard
            title="Claims loaded"
            value={isLoading ? "…" : String(claims.length)}
            detail="Live data for exports"
            icon={CalendarRange}
            variant="emerald"
            trend={{ label: "Current portfolio", direction: "up" }}
          />
          <MetricCard
            title="Evidence files"
            value={String(totalEvidence)}
            detail="Photos, PDFs & documents"
            icon={FileDown}
            variant="teal"
            trend={{ label: "Across all claims", direction: "neutral" }}
          />
          <MetricCard
            title="Selected"
            value={selected.code}
            detail={selected.title}
            icon={selected.icon}
            variant="gold"
            trend={{ label: format === "pdf" ? "PDF export" : "CSV export", direction: "neutral" }}
          />
        </MetricCardGrid>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Report picker */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-forest-200/70 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-forest-900">Which report do you want?</h2>
                <p className="mt-0.5 text-sm text-slate-500">Tap a card to select · filter or search below</p>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  className="input-field w-full pl-9"
                  placeholder="Search reports…"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterTab(tab.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    filterTab === tab.id
                      ? "bg-forest-700 text-white shadow-sm"
                      : "border border-forest-200 bg-forest-50/60 text-forest-800 hover:bg-forest-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {visibleReports.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-forest-200 bg-forest-50/40 px-4 py-8 text-center text-sm text-slate-600">
              No reports match your search. Try another keyword or filter.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {visibleReports.map((entry) => {
                const Icon = entry.icon;
                const active = selectedId === entry.id;
                const colors = REPORT_ACCENTS[entry.id];
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setSelectedId(entry.id)}
                    className={`group rounded-2xl border bg-white p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                      active
                        ? `border-forest-400 shadow-[0_8px_28px_rgba(27,67,50,0.12)] ring-2 ${colors.ring}`
                        : "border-forest-100/90 hover:border-forest-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl shadow-sm transition ${
                          active ? colors.icon : "bg-forest-50 text-forest-700 group-hover:bg-forest-100"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-forest-900">{entry.title}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wide ${colors.badge}`}>
                            {entry.code}
                          </span>
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-sm leading-snug text-slate-600">{entry.description}</p>
                        <p className={`mt-2 text-xs font-semibold ${colors.chip}`}>
                          {entry.supportsPdf && entry.supportsCsv
                            ? "PDF or CSV"
                            : entry.supportsPdf
                              ? "PDF only"
                              : "CSV only"}
                        </p>
                      </div>
                    </div>
                    {active ? (
                      <p className="mt-3 inline-flex rounded-full bg-forest-100 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-forest-800">
                        Selected
                      </p>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}

          {previewReady ? (
            <div className="overflow-hidden rounded-2xl border border-forest-200/80 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-forest-100 bg-forest-50/50 px-5 py-4">
                <div>
                  <h3 className="text-lg font-bold text-forest-900">Report preview</h3>
                  <p className="text-sm text-slate-600">{previewTable.summary}</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                  {format === "pdf" ? "PDF preview" : "CSV preview"}
                </span>
              </div>

              <div className="p-5">
                {format === "pdf" && pdfPreviewUrl ? (
                  <iframe
                    title="PDF report preview"
                    src={pdfPreviewUrl}
                    className="h-[480px] w-full rounded-xl border border-forest-100 bg-white"
                  />
                ) : null}

                {format === "csv" ? (
                  <div className="space-y-3">
                    <div className="overflow-x-auto rounded-xl border border-forest-100">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-forest-50 text-xs uppercase text-forest-700">
                          <tr>
                            {previewTable.headers.map((header) => (
                              <th key={header} className="px-4 py-3 font-semibold">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewTable.rows.map((row, index) => (
                            <tr key={index} className="border-t border-forest-50">
                              {row.map((cell, cellIndex) => (
                                <td key={cellIndex} className="px-4 py-2 text-slate-700">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {previewTable.rowCount > previewTable.rows.length ? (
                      <p className="text-xs text-slate-500">
                        Showing first {previewTable.rows.length} of {previewTable.rowCount} rows. Full data is in the download.
                      </p>
                    ) : null}
                    <pre className="max-h-40 overflow-auto rounded-xl border border-forest-100 bg-forest-50/50 p-3 text-xs text-slate-600">
                      {csvPreview.slice(0, 2000)}
                      {csvPreview.length > 2000 ? "\n…" : ""}
                    </pre>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {/* Export panel */}
        <div className="sticky top-4 self-start space-y-4">
          <div className="overflow-hidden rounded-2xl border border-forest-200/80 bg-white shadow-[0_12px_40px_rgba(27,67,50,0.08)]">
            <div className="border-b border-forest-100 bg-gradient-to-r from-forest-50 to-emerald-50/80 px-5 py-4">
              <h3 className="text-lg font-bold text-forest-900">Export options</h3>
              <p className="mt-1 text-sm text-slate-600">
                Selected: <span className="font-semibold text-forest-800">{selected.title}</span>
              </p>
            </div>

            <div className="space-y-5 p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-forest-800">
                  From date
                  <input
                    type="date"
                    className="input-field mt-2"
                    value={dateFrom}
                    onChange={(event) => {
                      setDateFrom(event.target.value);
                      setPreviewReady(false);
                    }}
                  />
                </label>
                <label className="block text-sm font-semibold text-forest-800">
                  To date
                  <input
                    type="date"
                    className="input-field mt-2"
                    value={dateTo}
                    onChange={(event) => {
                      setDateTo(event.target.value);
                      setPreviewReady(false);
                    }}
                  />
                </label>
              </div>

              {dateFrom && dateTo ? (
                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 px-3 py-2.5 text-sm text-emerald-900">
                  <span className="font-bold">{filteredClaims.length}</span> claims match
                  {selectedId === "claim" ? " (date range filters claim list)" : ""}
                  <span className="text-emerald-700"> · {periodLabel}</span>
                </div>
              ) : null}

              <div>
                <p className="text-sm font-semibold text-forest-800">Output format</p>
                <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl border border-forest-100 bg-forest-50/40 p-1">
                  <button
                    type="button"
                    className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                      format === "pdf"
                        ? "bg-white text-forest-800 shadow-sm ring-1 ring-forest-200"
                        : "text-slate-600 hover:text-forest-700"
                    }`}
                    onClick={() => setFormat("pdf")}
                  >
                    <FileDown className="h-4 w-4" />
                    PDF (branded)
                  </button>
                  {selected.supportsCsv ? (
                    <button
                      type="button"
                      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                        format === "csv"
                          ? "bg-white text-forest-800 shadow-sm ring-1 ring-forest-200"
                          : "text-slate-600 hover:text-forest-700"
                      }`}
                      onClick={() => setFormat("csv")}
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      CSV (data)
                    </button>
                  ) : (
                    <span className="grid place-items-center rounded-lg px-2 text-center text-xs text-slate-500">
                      CSV not available
                    </span>
                  )}
                </div>
              </div>

              <label className="block text-sm font-semibold text-forest-800">
                Report title (PDF header)
                <input
                  className="input-field mt-2"
                  value={reportTitle}
                  onChange={(event) => setReportTitle(event.target.value)}
                  disabled={format === "csv"}
                  placeholder={selected.defaultTitle}
                />
              </label>

              {selected.needsClaimPick ? (
                <label className="block text-sm font-semibold text-forest-800">
                  Which claim?
                  <select
                    className="input-field mt-2"
                    value={claimId}
                    onChange={(event) => setClaimId(event.target.value)}
                  >
                    <option value="">Select a claim…</option>
                    {claimsForPicker.map((claim) => (
                      <option key={claim.id} value={claim.id}>
                        {claim.id} — {claim.claimantName} ({claim.documents.length} files)
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {/* Branded header preview — forest green, not blue/black */}
              <div className="overflow-hidden rounded-2xl border border-forest-200">
                <div className="bg-gradient-to-br from-forest-600 via-forest-700 to-emerald-800 px-4 py-4 text-white">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img src={primeLogo} alt="Prime Insurance" className="h-11 rounded-lg bg-white p-1 shadow-sm" />
                      <div>
                        <p className="text-sm font-bold">Prime Insurance</p>
                        <p className="text-xs text-emerald-100/90">Digital Claims Portal · Rwanda</p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-emerald-100/90">
                      <p>Report date: {todayLabel}</p>
                      <p className="font-semibold text-white">Prepared by: {user?.name ?? "—"}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm font-semibold">{reportTitle || selected.defaultTitle}</p>
                  {dateFrom && dateTo ? (
                    <p className="mt-1 text-xs text-emerald-100/85">Period: {periodLabel}</p>
                  ) : null}
                </div>
                <div className={`h-1 bg-gradient-to-r from-emerald-400 to-teal-400`} />
                <div className="space-y-2 bg-forest-50/50 p-4 text-xs leading-relaxed text-slate-600">
                  <p>Preview the full report before downloading. PDF includes branded header, tables, and signature block.</p>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase ${accent.badge}`}>
                    {selected.code}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  className="btn-secondary inline-flex flex-1 items-center justify-center gap-2"
                  disabled={busy}
                  onClick={handlePreview}
                >
                  <Eye className="h-4 w-4" />
                  {busy ? "Generating…" : "Preview report"}
                </button>
                <button
                  type="button"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-forest-600 px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(27,67,50,0.2)] transition hover:from-emerald-600 hover:to-forest-700 disabled:opacity-50"
                  disabled={busy}
                  onClick={handleDownload}
                >
                  <FileDown className="h-4 w-4" />
                  Download
                </button>
              </div>
              <p className="text-center text-xs text-slate-500">
                {previewReady ? "Preview ready — download when you are satisfied." : "Tip: preview first to check the layout."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
