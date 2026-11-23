import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LogList } from '@/components/LogList';
import { listLogs } from '@/lib/logs';
import type { LogRow } from '@/lib/types';
import { colors, radius, glass } from '@/theme';

const STATUSES = [
  { label: 'Semua', value: undefined },
  { label: 'Terverifikasi', value: 'verified' },
  { label: 'Duplikat', value: 'duplicate' },
  { label: 'Ditolak', value: 'rejected' },
] as const;

export default function Logs() {
  const [q, setQ] = useState('');
  const [cls, setCls] = useState('');
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [rows, setRows] = useState<LogRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await listLogs({ q, class: cls, status }));
      setError(null);
    } catch {
      setError('Gagal memuat log. Periksa koneksi.');
    }
  }, [q, cls, status]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 15000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <View style={s.wrap}>
      <TextInput style={s.input} placeholder="Cari nama atau NIS" value={q} onChangeText={setQ} />
      <TextInput style={s.input} placeholder="Kelas" value={cls} onChangeText={setCls} autoCapitalize="characters" />
      <View style={s.chips}>
        {STATUSES.map((st) => (
          <Pressable key={st.label} onPress={() => setStatus(st.value)}
            style={[s.chip, status === st.value && { backgroundColor: colors.accent }]}>
            <Text style={[s.chipText, status === st.value && { color: '#fff' }]}>{st.label}</Text>
          </Pressable>
        ))}
      </View>
      {error && <Text style={s.error}>{error}</Text>}
      <LogList rows={rows} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 16, gap: 10, backgroundColor: colors.bg },
  input: { minHeight: 48, ...glass, borderRadius: radius, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, fontSize: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: 20, ...glass, borderWidth: 1, borderColor: colors.line, justifyContent: 'center' },
  chipText: { fontSize: 15, color: colors.ink },
  error: { color: colors.danger, fontSize: 15 },
});
