import { fireEvent, render, screen } from '@testing-library/react-native';
import Students from '@/app/(admin)/students/index';
import GradeStudents from '@/app/(admin)/students/kelas/[grade]';
import { listStudents } from '@/lib/admin';

const mockPush = jest.fn();
let mockGrade = '3';
jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: () => ({ grade: mockGrade }),
}));
jest.mock('@/lib/admin');
jest.mock('@/lib/supabase', () => ({ supabase: {} }));

const s = (nis: string, name: string, cls: string) => ({ nis, full_name: name, nickname: null, class_name: cls, photo_url: null, is_active: true });
const rows = [s('1', 'Aksa Pratama', '3-A'), s('2', 'Budi Santoso', '3-B'), s('3', 'Citra Lestari', '1-A'), s('4', 'Dimas Nugraha', '6-A')];

beforeEach(() => {
  jest.clearAllMocks();
  mockGrade = '3';
  (listStudents as jest.Mock).mockResolvedValue(rows);
});

test('six folders show how many students each grade has', async () => {
  await render(<Students />);
  expect(await screen.findByLabelText('Kelas 3, 2 murid')).toBeTruthy();
  for (const g of [1, 2, 4, 5, 6]) expect(screen.getByLabelText(new RegExp(`^Kelas ${g}, \\d+ murid`))).toBeTruthy();
  expect(screen.getByLabelText('Kelas 2, 0 murid')).toBeTruthy();
});

test('pressing a folder opens the dedicated grade page', async () => {
  await render(<Students />);
  await fireEvent.press(await screen.findByLabelText('Kelas 3, 2 murid'));
  expect(mockPush).toHaveBeenCalledWith('/students/kelas/3');
});

test('grade page lists only students from that grade', async () => {
  mockGrade = '3';
  await render(<GradeStudents />);
  expect(await screen.findByText('Aksa Pratama')).toBeTruthy();
  expect(screen.getByText('Budi Santoso')).toBeTruthy();
  expect(screen.queryByText('Citra Lestari')).toBeNull();
});

test('an empty grade page says so instead of showing a blank list', async () => {
  mockGrade = '2';
  await render(<GradeStudents />);
  expect(await screen.findByText(/Belum ada murid di kelas 2/)).toBeTruthy();
});
