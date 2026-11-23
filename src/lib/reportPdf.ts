import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { LogRow } from '@/lib/types';

export type ReportMeta = { date?: string; kelas?: string; status?: string; q?: string };

const TZ = 'Asia/Jakarta';
const STATUS = { verified: 'Terverifikasi', duplicate: 'Duplikat', rejected: 'Ditolak' } as const;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const longDate = (ymd: string) =>
  new Date(`${ymd}T12:00:00+07:00`).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: TZ });
const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ });
const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: TZ });

export const reportFileName = (m: ReportMeta) => `laporan-penjemputan-${m.date || 'semua'}.pdf`;

function filterLine(m: ReportMeta): string {
  const parts = [m.kelas && `Kelas ${m.kelas}`, m.status && (STATUS[m.status as keyof typeof STATUS] ?? m.status), m.q && `Cari: "${m.q}"`];
  return parts.filter(Boolean).join(', ');
}

export function buildReportHtml(rows: LogRow[], meta: ReportMeta): string {
  const count = (s: LogRow['status']) => rows.filter((r) => r.status === s).length;
  const showDate = !meta.date;
  const filters = filterLine(meta);

  const body = rows.map((r) => `<tr>
    <td>${showDate ? `${esc(shortDate(r.scanned_at))}<br>` : ''}${esc(clock(r.scanned_at))}</td>
    <td><b>${esc(r.student_name ?? 'QR tidak dikenal')}</b>${r.student_nis ? `<br><small>NIS ${esc(r.student_nis)}</small>` : ''}</td>
    <td>${esc(r.class_name ?? '-')}</td>
    <td>${r.guardian_name ? `${esc(r.guardian_name)} (${esc(r.relationship ?? '')})` : '-'}${r.substitute_name ? `<br><small>Pengganti: ${esc(r.substitute_name)} (${esc(r.substitute_status ?? '')})</small>` : ''}</td>
    <td class="st-${r.status}">${STATUS[r.status]}</td>
    <td>${esc(r.scanner_name ?? '-')}</td>
  </tr>`).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(reportFileName(meta))}</title><style>
    @page { margin: 16mm 12mm; }
    body { font-family: -apple-system, Roboto, Arial, sans-serif; color: #0f172a; font-size: 12px; }
    h1 { margin: 0 0 2px; font-size: 20px; }
    .sub { color: #475569; margin: 0 0 10px; }
    .sums { display: flex; gap: 8px; margin: 10px 0 14px; }
    .sum { flex: 1; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px 10px; }
    .sum span { display: block; color: #475569; font-size: 11px; }
    .sum b { font-size: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; background: #0f172a; color: #fff; padding: 6px 8px; font-size: 11px; }
    td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
    tr { page-break-inside: avoid; }
    small { color: #475569; }
    .st-verified { color: #15803d; font-weight: 700; }
    .st-duplicate { color: #b45309; font-weight: 700; }
    .st-rejected { color: #be123c; font-weight: 700; }
    .empty { text-align: center; color: #475569; padding: 28px; }
  </style></head><body>
    <h1>Laporan Penjemputan</h1>
    <p class="sub">${meta.date ? esc(longDate(meta.date)) : 'Semua tanggal'}${filters ? ` &middot; ${esc(filters)}` : ''}</p>
    <div class="sums">
      <div class="sum"><span>Dijemput</span> <b>${count('verified')}</b></div>
      <div class="sum"><span>Scan ganda</span> <b>${count('duplicate')}</b></div>
      <div class="sum"><span>Ditolak</span> <b>${count('rejected')}</b></div>
    </div>
    ${rows.length === 0 ? '<p class="empty">Tidak ada catatan.</p>' : `<table>
      <thead><tr><th>${showDate ? 'Tanggal, jam' : 'Jam'}</th><th>Murid</th><th>Kelas</th><th>Wali</th><th>Status</th><th>Petugas</th></tr></thead>
      <tbody>${body}</tbody></table>`}
  </body></html>`;
}

// expo-print ignores `html` on web and prints the whole app page, so the report goes into a hidden
// iframe and that is printed instead. "Save as PDF" in the print dialog makes the file.
function printInBrowser(html: string) {
  const frame = document.createElement('iframe');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  if (!doc || !win) { frame.remove(); throw new Error('print frame unavailable'); }
  doc.open();
  doc.write(html);
  doc.close();
  win.focus();
  win.print();
  setTimeout(() => frame.remove(), 60_000);
}

// Phone: a PDF file through the share sheet (Save to Files, send). Browser: the print dialog.
export async function downloadReport(
  rows: LogRow[],
  meta: ReportMeta,
  platform: string = Platform.OS,
  printHtml: (html: string) => void = printInBrowser,
): Promise<void> {
  const html = buildReportHtml(rows, meta);
  if (platform === 'web') {
    printHtml(html);
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: reportFileName(meta) });
}
