import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { buildReportHtml, downloadReport, reportFileName } from '@/lib/reportPdf';
import type { LogRow } from '@/lib/types';

jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(async () => ({ uri: 'file:///laporan.pdf' })),
  printAsync: jest.fn(async () => {}),
}));
jest.mock('expo-sharing', () => ({ shareAsync: jest.fn(async () => {}) }));

const row = (over: Partial<LogRow> = {}): LogRow => ({
  id: '1', scanned_at: '2026-11-23T00:10:00Z', status: 'verified', student_nis: '00101',
  student_name: 'Aksa Pratama', class_name: '3-A', guardian_name: 'Rina', relationship: 'Ibu',
  scanner_name: 'Petugas Satu', substitute_name: null, substitute_status: null, ...over,
});

beforeEach(() => jest.clearAllMocks());

describe('buildReportHtml', () => {
  test('has the title, the long date, the summary counts and every student', () => {
    const html = buildReportHtml(
      [row(), row({ id: '2', status: 'duplicate', student_name: 'Budi Santoso' }), row({ id: '3', status: 'rejected', student_name: null })],
      { date: '2026-11-23' });
    expect(html).toContain('Laporan Penjemputan');
    expect(html).toContain('Senin, 23 November 2026');
    expect(html).toContain('Aksa Pratama');
    expect(html).toContain('Budi Santoso');
    expect(html).toContain('QR tidak dikenal');
    expect(html).toMatch(/Dijemput<\/span>\s*<b>1<\/b>/);
    expect(html).toMatch(/Scan ganda<\/span>\s*<b>1<\/b>/);
    expect(html).toMatch(/Ditolak<\/span>\s*<b>1<\/b>/);
  });

  test('times are in Jakarta time (00:10 UTC is 07:10 WIB)', () => {
    expect(buildReportHtml([row()], { date: '2026-11-23' })).toContain('07.10');
  });

  test('a substitute pickup is spelled out', () => {
    const html = buildReportHtml([row({ substitute_name: 'Paman Joko', substitute_status: 'paman' })], { date: '2026-11-23' });
    expect(html).toContain('Pengganti: Paman Joko (paman)');
  });

  test('active filters are printed so the paper explains itself', () => {
    const html = buildReportHtml([row()], { date: '2026-11-23', kelas: '3-A', status: 'duplicate', q: 'aksa' });
    expect(html).toContain('Kelas 3-A');
    expect(html).toContain('Duplikat');
    expect(html).toContain('aksa');
  });

  test('without a date it says all dates and shows the date of each row', () => {
    const html = buildReportHtml([row()], {});
    expect(html).toContain('Semua tanggal');
    expect(html).toContain('23 Nov 2026');
  });

  test('an empty report says so', () => {
    expect(buildReportHtml([], { date: '2026-11-23' })).toContain('Tidak ada catatan');
  });

  test('names are HTML-escaped', () => {
    const html = buildReportHtml([row({ student_name: '<script>x</script>' })], { date: '2026-11-23' });
    expect(html).not.toContain('<script>x</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});

test('file name carries the date or "semua"', () => {
  expect(reportFileName({ date: '2026-11-23' })).toBe('laporan-penjemputan-2026-11-23.pdf');
  expect(reportFileName({})).toBe('laporan-penjemputan-semua.pdf');
});

describe('downloadReport', () => {
  test('on a phone it creates a PDF and opens the share sheet', async () => {
    await downloadReport([row()], { date: '2026-11-23' }, 'ios');
    expect((Print.printToFileAsync as jest.Mock).mock.calls[0][0].html).toContain('Aksa Pratama');
    expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///laporan.pdf', expect.anything());
  });

  test('in the browser it prints the report itself, not the app page (expo-print ignores html on web)', async () => {
    const printHtml = jest.fn();
    await downloadReport([row()], { date: '2026-11-23' }, 'web', printHtml);
    expect(printHtml).toHaveBeenCalledWith(expect.stringContaining('Aksa Pratama'));
    expect(Print.printAsync).not.toHaveBeenCalled();
    expect(Print.printToFileAsync).not.toHaveBeenCalled();
  });
});
