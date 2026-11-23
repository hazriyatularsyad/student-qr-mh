import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import StudentDetail from '@/app/(admin)/students/[nis]';
import { getGuardian, getQrToken, listStudents } from '@/lib/admin';
import { downloadQr } from '@/lib/qrDownload';

jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ nis: '00101' }) }));
jest.mock('react-native-qrcode-svg', () => 'QRCode');
jest.mock('expo-image-picker', () => ({}));
jest.mock('@/lib/admin');
jest.mock('@/lib/qrDownload');
jest.mock('@/lib/supabase', () => ({ supabase: { storage: { from: () => ({ createSignedUrl: async () => ({ data: null }) }) } } }));

const student = { nis: '00101', full_name: 'Aksa Pratama', nickname: 'Aksa', class_name: '3-A', photo_url: null, is_active: true };
const guardian = { id: 'g1', student_nis: '00101', full_name: 'Rina', relationship: 'Ibu', phone_number: '0811', is_active: true };

beforeEach(() => {
  jest.clearAllMocks();
  (listStudents as jest.Mock).mockResolvedValue([student]);
  (getGuardian as jest.Mock).mockResolvedValue(guardian);
});

test('shows the student data and downloads the stored QR', async () => {
  (getQrToken as jest.Mock).mockResolvedValue('t'.repeat(64));
  await render(<StudentDetail />);
  expect(await screen.findByText('Aksa Pratama')).toBeTruthy();
  expect(screen.getByText(/Kelas 3-A/)).toBeTruthy();
  await fireEvent.press(await screen.findByText('Unduh QR'));
  await waitFor(() => expect(downloadQr).toHaveBeenCalledWith(
    { studentName: 'Aksa Pratama', className: '3-A', nis: '00101', token: 't'.repeat(64) }));
});

test('a guardian whose QR was issued before token storage asks for a reissue', async () => {
  (getQrToken as jest.Mock).mockResolvedValue(null);
  await render(<StudentDetail />);
  expect(await screen.findByText(/QR belum tersimpan/)).toBeTruthy();
  expect(screen.queryByText('Unduh QR')).toBeNull();
});
