import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import Login from '@/app/(auth)/login';
import { useAuth } from '@/lib/auth';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock('@/lib/auth');
jest.mock('@/lib/supabase', () => ({ supabase: {} }));

beforeEach(() => jest.clearAllMocks());

test('wrong credentials show the error and stay on the login screen', async () => {
  (useAuth as jest.Mock).mockReturnValue({ signIn: jest.fn(async () => 'Email atau kata sandi salah.') });
  await render(<Login />);
  await fireEvent.changeText(screen.getByPlaceholderText('Email'), 'a@b.id');
  await fireEvent.changeText(screen.getByPlaceholderText('Kata sandi'), 'salahsalah');
  await fireEvent.press(screen.getByText('Masuk'));
  expect(await screen.findByText('Email atau kata sandi salah.')).toBeTruthy();
  expect(mockReplace).not.toHaveBeenCalled();
});

test('successful sign-in goes to the role router', async () => {
  (useAuth as jest.Mock).mockReturnValue({ signIn: jest.fn(async () => null) });
  await render(<Login />);
  await fireEvent.press(screen.getByText('Masuk'));
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'));
});

test('pressing enter in the password field submits', async () => {
  const signIn = jest.fn(async () => null);
  (useAuth as jest.Mock).mockReturnValue({ signIn });
  await render(<Login />);
  await fireEvent.changeText(screen.getByPlaceholderText('Email'), 'a@b.id');
  await fireEvent.changeText(screen.getByPlaceholderText('Kata sandi'), 'rahasia123');
  await fireEvent(screen.getByPlaceholderText('Kata sandi'), 'submitEditing');
  await waitFor(() => expect(signIn).toHaveBeenCalledWith('a@b.id', 'rahasia123'));
});
