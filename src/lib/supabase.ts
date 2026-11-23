import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const storage = {
  getItem: (k: string) => SecureStore.getItemAsync(k),
  setItem: (k: string, v: string) => SecureStore.setItemAsync(k, v),
  removeItem: (k: string) => SecureStore.deleteItemAsync(k),
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321',
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  { auth: { storage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } },
);
