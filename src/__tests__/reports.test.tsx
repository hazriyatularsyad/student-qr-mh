import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import Reports from '@/app/(admin)/reports';
import { listLogs } from '@/lib/logs';
import { downloadReport } from '@/lib/reportPdf';
import type { LogRow } from '@/lib/types';

jest.mock('@/lib/logs');
jest.mock('@/lib/reportPdf');
jest.mock('@/lib/supabase', () => ({ supabase: {} }));

const row: LogRow = {
  id: '1', scanned_at: '2026-11-23T00:10:00Z', status: 'verified', student_nis: '00101',
  student_name: 'Aksa Pratama', class_name: '3-A', guardian_name: 'Rina', relationship: 'Ibu',
  scanner_name: 'Petugas Satu', substitute_name: null, substitute_status: null,
};

beforeEach(() => { jest.clearAllMocks(); (listLogs as jest.Mock).mockResolvedValue([row]); });

test('Unduh PDF exports what is on screen with the current filters', async () => {
  await render(<Reports />);
  await fireEvent.changeText(screen.getByPlaceholderText('Kelas'), '3-A');
  await waitFor(() => expect(listLogs).toHaveBeenLastCalledWith(expect.objectContaining({ class: '3-A' })));
  await fireEvent.press(await screen.findByText('Unduh PDF'));
  await waitFor(() => expect(downloadReport).toHaveBeenCalledWith(
    [row], expect.objectContaining({ kelas: '3-A' })));
});

test('with nothing to export it says so instead of making an empty file', async () => {
  (listLogs as jest.Mock).mockResolvedValue([]);
  await render(<Reports />);
  await fireEvent.press(await screen.findByText('Unduh PDF'));
  expect(await screen.findByText(/Tidak ada data untuk diunduh/)).toBeTruthy();
  expect(downloadReport).not.toHaveBeenCalled();
});

test('a failed export shows an error', async () => {
  (downloadReport as jest.Mock).mockRejectedValueOnce(new Error('boom'));
  await render(<Reports />);
  await fireEvent.press(await screen.findByText('Unduh PDF'));
  expect(await screen.findByText(/Gagal membuat PDF/)).toBeTruthy();
});
