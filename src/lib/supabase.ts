import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createSessionStorage } from '@/lib/storage';

const storage = createSessionStorage(
  Platform.OS,
  SecureStore,
  Platform.OS === 'web' && typeof localStorage !== 'undefined' ? localStorage : null,
);

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321',
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  { auth: { storage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } },
);
