import { fireEvent, render, screen } from '@testing-library/react-native';
import { LogoutButton } from '@/components/LogoutButton';
import { confirmAction } from '@/lib/confirm';
import { useAuth } from '@/lib/auth';

jest.mock('@/lib/confirm');
jest.mock('@/lib/auth');
jest.mock('@/lib/supabase', () => ({ supabase: {} }));

const signOut = jest.fn(async () => {});
beforeEach(() => { jest.clearAllMocks(); (useAuth as jest.Mock).mockReturnValue({ signOut }); });

test('asks before signing out and signs out only after confirming', async () => {
  (confirmAction as jest.Mock).mockImplementation((_t: string, _m: string, onYes: () => void) => onYes());
  await render(<LogoutButton />);
  await fireEvent.press(screen.getByLabelText('Keluar'));
  expect(confirmAction).toHaveBeenCalledTimes(1);
  expect(signOut).toHaveBeenCalledTimes(1);
});

test('cancelling the confirmation keeps the session', async () => {
  (confirmAction as jest.Mock).mockImplementation(() => {});
  await render(<LogoutButton />);
  await fireEvent.press(screen.getByLabelText('Keluar'));
  expect(signOut).not.toHaveBeenCalled();
});
