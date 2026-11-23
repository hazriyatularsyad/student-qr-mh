import { createSessionStorage } from '@/lib/storage';

const secure = { getItemAsync: jest.fn(async () => 'from-secure'), setItemAsync: jest.fn(async () => {}), deleteItemAsync: jest.fn(async () => {}) };

test('native uses secure store', async () => {
  const st = createSessionStorage('ios', secure, null);
  expect(await st.getItem('k')).toBe('from-secure');
  await st.setItem('k', 'v');
  expect(secure.setItemAsync).toHaveBeenCalledWith('k', 'v');
});

test('web falls back to localStorage and never touches secure store', async () => {
  const mem = new Map<string, string>();
  const local = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k) };
  const st = createSessionStorage('web', secure, local);
  await st.setItem('k', 'v');
  expect(await st.getItem('k')).toBe('v');
  await st.removeItem('k');
  expect(await st.getItem('k')).toBeNull();
  expect(secure.getItemAsync).not.toHaveBeenCalledWith('k', expect.anything());
});
