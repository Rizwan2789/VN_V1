/**
 * Builds a CSV file client-side and triggers a browser download — same
 * Blob → object URL → synthetic `<a download>` pattern StudentService already
 * uses for receipt PDFs, just with an in-memory CSV string instead of a
 * fetched blob.
 */
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const escapeCell = (value: string | number): string => {
    const str = String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };

  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(','));
  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
