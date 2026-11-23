import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { importStudents } from '@/lib/admin';
import { buildCardsHtml } from '@/lib/cards';
import { parseStudentsCsv } from '@/lib/csv';

type Err = { row: number; message: string };
export type ImportOutcome =
  | { kind: 'csv-errors'; errors: Err[] }
  | { kind: 'db-errors'; errors: Err[] }
  | { kind: 'done'; cards: number };

// Parse -> import (all or nothing) -> print cards for newly issued tokens only.
export async function runImport(csvText: string): Promise<ImportOutcome> {
  const parsed = parseStudentsCsv(csvText);
  if (parsed.errors.length) return { kind: 'csv-errors', errors: parsed.errors };

  const res = await importStudents(parsed.rows);
  if (!res.ok) return { kind: 'db-errors', errors: res.errors };
  if (res.issued.length === 0) return { kind: 'done', cards: 0 };

  const html = await buildCardsHtml(res.issued.map((i) => ({
    studentName: i.student_name, className: i.class_name, nis: i.nis, token: i.token,
  })));
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  return { kind: 'done', cards: res.issued.length };
}
