/**
 * Utility functions for exporting tabular microdata and analytical series
 * into standard CSV and JSON formats for NSO / RBI economists and researchers.
 */

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToJson(data: unknown, filename = "aeroindex_export.json"): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" });
  downloadBlob(blob, filename);
}

export function exportToCsv<T extends Record<string, unknown>>(
  data: T[],
  filename = "aeroindex_microdata.csv",
  columns?: { key: keyof T; header: string }[]
): void {
  if (!data || data.length === 0) return;

  const cols =
    columns ||
    (Object.keys(data[0]) as (keyof T)[]).map((key) => ({
      key,
      header: String(key),
    }));

  const headerRow = cols.map((col) => `"${col.header.replace(/"/g, '""')}"`).join(",");

  const bodyRows = data.map((row) =>
    cols
      .map((col) => {
        const val = row[col.key];
        if (val === null || val === undefined) return '""';
        const strVal = typeof val === "object" ? JSON.stringify(val) : String(val);
        return `"${strVal.replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  const csvContent = [headerRow, ...bodyRows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, filename);
}
