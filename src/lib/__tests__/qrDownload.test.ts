import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { downloadQr, qrFileName } from '@/lib/qrDownload';

jest.mock('expo-print', () => ({ printToFileAsync: jest.fn(async () => ({ uri: 'file:///qr.pdf' })) }));
jest.mock('expo-sharing', () => ({ shareAsync: jest.fn(async () => {}) }));

const card = { studentName: 'Aksa Pratama', className: '3-A', nis: '00101', token: 'a'.repeat(64) };
beforeEach(() => jest.clearAllMocks());

test('file name uses the NIS', () => {
  expect(qrFileName('00101')).toBe('qr-00101.png');
});

test('on a phone it builds a one-card PDF and opens the share sheet', async () => {
  await downloadQr(card, 'ios');
  const html = (Print.printToFileAsync as jest.Mock).mock.calls[0][0].html as string;
  expect(html.match(/<svg/g)).toHaveLength(1);
  expect(html).toContain('Aksa Pratama');
  expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///qr.pdf', expect.anything());
});

test('in the browser it saves a PNG named after the NIS', async () => {
  const save = jest.fn();
  await downloadQr(card, 'web', save);
  expect(save).toHaveBeenCalledWith(expect.stringMatching(/^data:image\/png;base64,/), 'qr-00101.png');
  expect(Print.printToFileAsync).not.toHaveBeenCalled();
});
