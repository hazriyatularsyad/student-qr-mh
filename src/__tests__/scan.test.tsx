import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as Speech from 'expo-speech';
import { checkPickup, confirmPickup } from '@/lib/pickup';
import Scan from '@/app/(petugas)/scan';

let mockOnScan: (event: { data: string }) => void;

jest.mock('expo-camera', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    CameraView: (props: { onBarcodeScanned?: typeof mockOnScan }) => {
      mockOnScan = props.onBarcodeScanned as typeof mockOnScan;
      return React.createElement(View, { testID: 'camera' });
    },
    useCameraPermissions: () => [{ granted: true }, jest.fn()],
  };
});
jest.mock('expo-speech', () => ({ speak: jest.fn((_t: string, o: { onDone?: () => void }) => o.onDone?.()) }));
jest.mock('@/lib/pickup');
jest.mock('@/lib/supabase', () => ({
  supabase: { storage: { from: () => ({ createSignedUrl: async () => ({ data: { signedUrl: 'http://x/p.jpg' } }) }) } },
}));

const student = { nis: '001', full_name: 'Aksa Pratama', nickname: 'Aksa', class_name: '3-A', photo_url: null };
const ready = { status: 'ready', message: '', student, guardian: { full_name: 'Rina', relationship: 'Ibu' } };
const verified = { status: 'verified', message: '', student, guardian: { full_name: 'Rina', relationship: 'Ibu' } };

const scan = async (token = 'T1') => {
  await act(async () => { mockOnScan({ data: token }); });
};

beforeEach(() => {
  jest.clearAllMocks();
  (checkPickup as jest.Mock).mockResolvedValue(ready);
  (confirmPickup as jest.Mock).mockResolvedValue(verified);
});

test('ready shows the registered guardian and stays silent until confirmed', async () => {
  await render(<Scan />);
  await scan();
  expect(await screen.findByText(/Rina/)).toBeTruthy();
  expect(Speech.speak).not.toHaveBeenCalled();
});

test('Konfirmasi records the pickup and then speaks name and class', async () => {
  await render(<Scan />);
  await scan();
  await fireEvent.press(await screen.findByText('Konfirmasi'));
  await waitFor(() => expect(Speech.speak).toHaveBeenCalledWith(
    'Aksa kelas 3 A sudah dijemput.', expect.objectContaining({ language: 'id-ID' })));
  expect(confirmPickup).toHaveBeenCalledWith('T1', undefined);
});

test('a network error on confirm stays silent and can be retried once per press', async () => {
  (confirmPickup as jest.Mock).mockRejectedValueOnce(new Error('network'));
  await render(<Scan />);
  await scan();
  await fireEvent.press(await screen.findByText('Konfirmasi'));
  expect(await screen.findByText(/Gagal terhubung/)).toBeTruthy();
  expect(Speech.speak).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText('Konfirmasi'));
  await waitFor(() => expect(Speech.speak).toHaveBeenCalledTimes(1));
  expect(confirmPickup).toHaveBeenCalledTimes(2);
});

test('substitute needs both name and status', async () => {
  await render(<Scan />);
  await scan();
  await fireEvent.press(await screen.findByText('Dijemput orang lain'));
  await fireEvent.changeText(screen.getByPlaceholderText('Nama penjemput'), 'Paman Joko');
  await fireEvent.press(screen.getByText('Konfirmasi penjemput pengganti'));
  expect(confirmPickup).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByPlaceholderText(/Status/), 'paman');
  await fireEvent.press(screen.getByText('Konfirmasi penjemput pengganti'));
  await waitFor(() => expect(confirmPickup).toHaveBeenCalledWith('T1', { name: 'Paman Joko', status: 'paman' }));
});

test('duplicate shows a warning without a confirm button', async () => {
  (checkPickup as jest.Mock).mockResolvedValue({
    status: 'duplicate', message: 'Murid ini sudah dijemput hari ini.', student,
    previous_scanner_name: 'Petugas Satu', previous_scanned_at: '2026-11-23T07:00:00Z' });
  await render(<Scan />);
  await scan();
  expect(await screen.findByText(/sudah dijemput hari ini/)).toBeTruthy();
  expect(screen.queryByText('Konfirmasi')).toBeNull();
});

test('the same QR within the cooldown triggers only one check', async () => {
  await render(<Scan />);
  await scan('SAME');
  await fireEvent.press(await screen.findByText('Tutup'));
  await scan('SAME');
  expect(checkPickup).toHaveBeenCalledTimes(1);
});
