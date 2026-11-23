import { fireEvent, render, screen } from '@testing-library/react-native';
import Students from '@/app/(admin)/students/index';
import { listStudents } from '@/lib/admin';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/lib/admin');
jest.mock('@/lib/supabase', () => ({ supabase: {} }));

const s = (nis: string, name: string, cls: string) => ({ nis, full_name: name, nickname: null, class_name: cls, photo_url: null, is_active: true });
const rows = [s('1', 'Aksa Pratama', '3-A'), s('2', 'Budi Santoso', '3-B'), s('3', 'Citra Lestari', '1-A'), s('4', 'Dimas Nugraha', '6-A')];

beforeEach(() => { jest.clearAllMocks(); (listStudents as jest.Mock).mockResolvedValue(rows); });

test('six folders show how many students each grade has', async () => {
  await render(<Students />);
  expect(await screen.findByLabelText('Kelas 3, 2 murid')).toBeTruthy();
  for (const g of [1, 2, 4, 5, 6]) expect(screen.getByLabelText(new RegExp(`^Kelas ${g}, \\d+ murid`))).toBeTruthy();
  expect(screen.getByLabelText('Kelas 2, 0 murid')).toBeTruthy();
});

test('pressing a folder filters the list and pressing it again shows everyone', async () => {
  await render(<Students />);
  await fireEvent.press(await screen.findByLabelText('Kelas 3, 2 murid'));
  expect(screen.getByText('Aksa Pratama')).toBeTruthy();
  expect(screen.getByText('Budi Santoso')).toBeTruthy();
  expect(screen.queryByText('Citra Lestari')).toBeNull();
  await fireEvent.press(screen.getByLabelText('Kelas 3, 2 murid'));
  expect(screen.getByText('Citra Lestari')).toBeTruthy();
});

test('an empty grade says so instead of showing a blank list', async () => {
  await render(<Students />);
  await fireEvent.press(await screen.findByLabelText('Kelas 2, 0 murid'));
  expect(screen.getByText(/Belum ada murid di kelas 2/)).toBeTruthy();
});
