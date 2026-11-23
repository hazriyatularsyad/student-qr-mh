import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(async () => ({ data: { session: null } })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(async () => ({})),
    },
    rpc: jest.fn(),
  },
}));

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;
const session = { user: { id: 'u1' } };

beforeEach(() => jest.clearAllMocks());

test('signIn resolves only after the staff role is known, so the first tap is enough', async () => {
  (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({ data: { session }, error: null });
  (supabase.rpc as jest.Mock).mockResolvedValue({ data: 'admin' });
  const { result } = await renderHook(() => useAuth(), { wrapper });
  let err: string | null = 'unset';
  await act(async () => { err = await result.current.signIn('a@b.id', 'rahasia123'); });
  expect(err).toBeNull();
  expect(result.current.role).toBe('admin');
  expect(result.current.session).toBe(session);
});

test('an account without a staff row is refused with a clear message and signed out', async () => {
  (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({ data: { session }, error: null });
  (supabase.rpc as jest.Mock).mockResolvedValue({ data: null });
  const { result } = await renderHook(() => useAuth(), { wrapper });
  let err: string | null = null;
  await act(async () => { err = await result.current.signIn('a@b.id', 'rahasia123'); });
  expect(err).toMatch(/belum terdaftar/);
  expect(supabase.auth.signOut).toHaveBeenCalled();
  expect(result.current.role).toBeNull();
});

test('wrong credentials keep the generic message', async () => {
  (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({ data: { session: null }, error: { message: 'x' } });
  const { result } = await renderHook(() => useAuth(), { wrapper });
  let err: string | null = null;
  await act(async () => { err = await result.current.signIn('a@b.id', 'salah'); });
  expect(err).toBe('Email atau kata sandi salah.');
});

test('the sign-in event and signIn share one role lookup instead of racing', async () => {
  let fire: (e: string, s: unknown) => void = () => {};
  (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((cb: typeof fire) => {
    fire = cb;
    return { data: { subscription: { unsubscribe: jest.fn() } } };
  });
  (supabase.auth.signInWithPassword as jest.Mock).mockImplementation(async () => {
    fire('SIGNED_IN', session); // supabase-js notifies subscribers before signIn returns
    return { data: { session: { ...session, access_token: 'tok' } }, error: null };
  });
  (supabase.rpc as jest.Mock).mockImplementation(async () => { await Promise.resolve(); return { data: 'petugas' }; });
  // the event carries the same token
  (session as { access_token?: string }).access_token = 'tok';
  const { result } = await renderHook(() => useAuth(), { wrapper });
  await act(async () => { await result.current.signIn('a@b.id', 'rahasia123'); });
  expect(supabase.rpc).toHaveBeenCalledTimes(1);
  expect(supabase.auth.signOut).not.toHaveBeenCalled();
  expect(result.current.role).toBe('petugas');
});
