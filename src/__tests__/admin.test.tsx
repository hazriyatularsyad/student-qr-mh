import { render, screen } from '@testing-library/react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { importStudents } from '@/lib/admin';
import { runImport } from '@/lib/importFlow';
import AdminLayout from '@/app/(admin)/_layout';
import { useAuth } from '@/lib/auth';

jest.mock('expo-print', () => ({ printToFileAsync: jest.fn(async () => ({ uri: 'file:///cards.pdf' })) }));
jest.mock('expo-sharing', () => ({ shareAsync: jest.fn(async () => {}) }));
jest.mock('@/lib/admin');
jest.mock('@/lib/auth');
jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('expo-router', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const Tabs = ({ children }: { children?: unknown }) => React.createElement(React.Fragment, null, children);
  Tabs.Screen = () => null;
  return { Redirect: ({ href }: { href: string }) => React.createElement(Text, null, `redirect:${href}`), Tabs };
});

const H = 'nis,nama_murid,panggilan,kelas,nama_wali,hubungan,no_hp';

beforeEach(() => jest.clearAllMocks());

test('a CSV with errors never reaches the database', async () => {
  const r = await runImport(`${H}\n001,A,,,W,Ibu,1\n`);
  expect(r).toEqual({ kind: 'csv-errors', errors: [{ row: 1, message: expect.stringContaining('kelas') }] });
  expect(importStudents).not.toHaveBeenCalled();
});

test('database row errors are returned and nothing is printed', async () => {
  (importStudents as jest.Mock).mockResolvedValue({ ok: false, errors: [{ row: 2, message: 'x' }] });
  const r = await runImport(`${H}\n001,A,,1-A,W,Ibu,1\n`);
  expect(r).toEqual({ kind: 'db-errors', errors: [{ row: 2, message: 'x' }] });
  expect(Print.printToFileAsync).not.toHaveBeenCalled();
});

test('a successful import prints one card per issued token and shares the PDF', async () => {
  (importStudents as jest.Mock).mockResolvedValue({ ok: true, issued: [
    { nis: '001', student_name: 'A', class_name: '1-A', token: 'a'.repeat(64) },
    { nis: '002', student_name: 'B', class_name: '1-A', token: 'b'.repeat(64) },
  ] });
  const r = await runImport(`${H}\n001,A,,1-A,W,Ibu,1\n002,B,,1-A,W,Ibu,2\n`);
  expect(r).toEqual({ kind: 'done', cards: 2 });
  const html = (Print.printToFileAsync as jest.Mock).mock.calls[0][0].html as string;
  expect(html.match(/<svg/g)).toHaveLength(2);
  expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///cards.pdf', expect.anything());
});

test('an import that issues no new cards prints nothing', async () => {
  (importStudents as jest.Mock).mockResolvedValue({ ok: true, issued: [] });
  const r = await runImport(`${H}\n001,A,,1-A,W,Ibu,1\n`);
  expect(r).toEqual({ kind: 'done', cards: 0 });
  expect(Print.printToFileAsync).not.toHaveBeenCalled();
});

test('a petugas account opening the admin area is redirected', async () => {
  (useAuth as jest.Mock).mockReturnValue({ role: 'petugas', loading: false });
  await render(<AdminLayout />);
  expect(screen.getByText('redirect:/')).toBeTruthy();
});
