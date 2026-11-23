import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LogList } from '@/components/LogList';
import { Field, Heading, Panel } from '@/components/form';
import { listLogs } from '@/lib/logs';
import type { LogRow } from '@/lib/types';
import { colors, radius } from '@/theme';

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
      <Heading>Log hari ini</Heading>
      <Panel>
        <Field placeholder="Cari nama atau NIS" value={q} onChangeText={setQ} />
        <Field placeholder="Kelas" value={cls} onChangeText={setCls} autoCapitalize="characters" />
        <View style={s.chips}>
          {STATUSES.map((st) => (
            <Pressable key={st.label} onPress={() => setStatus(st.value)}
              style={[s.chip, status === st.value && { backgroundColor: colors.goldDeep }]}>
              <Text style={[s.chipText, status === st.value && { color: colors.cream }]}>{st.label}</Text>
            </Pressable>
          ))}
        </View>
      </Panel>
      {error && <Text style={s.error}>{error}</Text>}
      <LogList rows={rows} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 16, gap: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, paddingHorizontal: 16, borderRadius: radius, backgroundColor: 'rgba(255,255,255,0.45)', borderWidth: 1, borderColor: colors.line, justifyContent: 'center' },
  chipText: { fontSize: 15, fontWeight: '700', color: colors.ink },
  error: { color: colors.danger, fontSize: 15 },
});
