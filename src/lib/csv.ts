import Papa from 'papaparse';

export type ImportRow = {
  nis: string; nama_murid: string; panggilan: string; kelas: string;
  nama_wali: string; hubungan: string; no_hp: string;
};
export type CsvError = { row: number; message: string };

const COLUMNS = ['nis', 'nama_murid', 'panggilan', 'kelas', 'nama_wali', 'hubungan', 'no_hp'] as const;
const REQUIRED = COLUMNS.filter((c) => c !== 'panggilan');

export function parseStudentsCsv(text: string): { rows: ImportRow[]; errors: CsvError[] } {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    delimitersToGuess: [',', ';'],
    dynamicTyping: false, // keep NIS such as "00123" as strings
    transformHeader: (h) => h.replace(/^﻿/, '').trim().toLowerCase(),
  });

  const fields = parsed.meta.fields ?? [];
  const missing = COLUMNS.filter((c) => !fields.includes(c));
  if (missing.length) {
    return { rows: [], errors: [{ row: 0, message: `Kolom tidak ada: ${missing.join(', ')}.` }] };
  }

  const rows: ImportRow[] = [];
  const errors: CsvError[] = [];
  const seen = new Set<string>();
  parsed.data.forEach((raw, i) => {
    const row = Object.fromEntries(COLUMNS.map((c) => [c, (raw[c] ?? '').trim()])) as ImportRow;
    const empty = REQUIRED.filter((c) => !row[c]);
    if (empty.length) errors.push({ row: i + 1, message: `Kolom ${empty.join(', ')} wajib diisi.` });
    if (row.nis && seen.has(row.nis)) errors.push({ row: i + 1, message: `NIS ${row.nis} dobel di file.` });
    seen.add(row.nis);
    rows.push(row);
  });
  return { rows: errors.length ? [] : rows, errors };
}
