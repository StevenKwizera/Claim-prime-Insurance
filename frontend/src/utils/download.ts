type CsvValue = string | number | boolean | null | undefined;

const escapeCsv = (value: CsvValue) => {
  const text = value === null || value === undefined ? "" : String(value);
  const needsQuotes = /[",\n\r]/.test(text);
  const escaped = text.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
};

export const toCsv = (rows: Array<Record<string, CsvValue>>) => {
  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>())
  );

  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((key) => escapeCsv(row[key])).join(","))
  ];

  return lines.join("\n");
};

export const downloadTextFile = (filename: string, content: string, mimeType = "text/plain;charset=utf-8") => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 2500);
};

export const downloadCsv = (filename: string, rows: Array<Record<string, CsvValue>>) => {
  const csv = toCsv(rows);
  downloadTextFile(filename, csv, "text/csv;charset=utf-8");
};

