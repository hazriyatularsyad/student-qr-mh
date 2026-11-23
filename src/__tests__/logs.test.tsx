import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { listLogs } from '@/lib/logs';
import { LogList } from '@/components/LogList';
import Logs from '@/app/(petugas)/logs';
import type { LogRow } from '@/lib/types';

jest.mock('@/lib/logs');
jest.mock('@/lib/supabase', () => ({ supabase: {} }));

const row = (over: Partial<LogRow> = {}): LogRow => ({
  id: '1', scanned_at: '2026-11-23T07:00:00Z', status: 'verified', student_nis: '001',
  student_name: 'Aksa Pratama', class_name: '3-A', guardian_name: 'Rina', relationship: 'Ibu',
  scanner_name: 'Petugas Satu', substitute_name: null, substitute_status: null, ...over,
});

beforeEach(() => { jest.clearAllMocks(); (listLogs as jest.Mock).mockResolvedValue([row()]); });

test('a substitute pickup shows who picked up and their status', async () => {
  await render(<LogList rows={[row({ substitute_name: 'Paman Joko', substitute_status: 'paman' })]} />);
  expect(screen.getByText('Pengganti: Paman Joko (paman)')).toBeTruthy();
});

test('a rejected row with no student still renders', async () => {
  await render(<LogList rows={[row({ status: 'rejected', student_nis: null, student_name: null, class_name: null, guardian_name: null })]} />);
  expect(screen.getByText('QR tidak dikenal')).toBeTruthy();
});

test('search, class and status filters are sent to the RPC', async () => {
  await render(<Logs />);
  await fireEvent.changeText(screen.getByPlaceholderText('Cari nama atau NIS'), 'Aksa');
  await fireEvent.changeText(screen.getByPlaceholderText('Kelas'), '3-A');
  await fireEvent.press(screen.getByText('Duplikat'));
  await waitFor(() => expect(listLogs).toHaveBeenLastCalledWith({ q: 'Aksa', class: '3-A', status: 'duplicate' }));
});
