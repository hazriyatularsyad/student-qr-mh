import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BentoGrid, Tile, TileLabel, TileValue } from '@/components/Bento';
import { LogList } from '@/components/LogList';
import { Field, Panel } from '@/components/form';
import { listLogs } from '@/lib/logs';
import { summarize } from '@/lib/summary';
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
  const [day, setDay] = useState<LogRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [all, filtered] = await Promise.all([listLogs({}), listLogs({ q, class: cls, status })]);
      setDay(all);
      setRows(filtered);
      setError(null);
    } catch {
      setError('Gagal memuat log. Periksa koneksi.');
    }
  }, [q, cls, status]);

  const sum = summarize(day);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 15000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <BentoGrid>
        <Tile tone="forest" span={2}>
          <TileLabel tone="forest">Dijemput hari ini</TileLabel>
          <TileValue tone="forest" size={48}>{sum.verified}</TileValue>
        </Tile>
        <Tile tone="coral">
          <TileLabel tone="coral">Scan ganda</TileLabel>
          <TileValue tone="coral">{sum.duplicate}</TileValue>
        </Tile>
        <Tile tone="plum">
          <TileLabel tone="plum">QR ditolak</TileLabel>
          <TileValue tone="plum">{sum.rejected}</TileValue>
        </Tile>
        <Tile tone="indigo" span={2}>
          <TileLabel tone="indigo">Terakhir dijemput</TileLabel>
          <Text style={s.last}>{sum.last ? `${sum.last.student_name}, kelas ${sum.last.class_name}` : 'Belum ada'}</Text>
        </Tile>
      </BentoGrid>
      <Panel>
        <Field icon="search-outline" placeholder="Cari nama atau NIS" value={q} onChangeText={setQ} />
        <Field placeholder="Kelas" value={cls} onChangeText={setCls} autoCapitalize="characters" />
        <View style={s.chips}>
          {STATUSES.map((st) => (
            <Pressable key={st.label} onPress={() => setStatus(st.value)}
              style={[s.chip, status === st.value && { backgroundColor: colors.navy }]}>
              <Text style={[s.chipText, status === st.value && { color: '#FFFFFF' }]}>{st.label}</Text>
            </Pressable>
          ))}
        </View>
      </Panel>
      {error && <Text style={s.error}>{error}</Text>}
      <LogList rows={rows} inline />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 16, gap: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, paddingHorizontal: 16, borderRadius: radius, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.line, justifyContent: 'center' },
  chipText: { fontSize: 15, fontWeight: '700', color: colors.ink },
  last: { color: '#fff', fontSize: 20, fontWeight: '800' },
  error: { color: colors.danger, fontSize: 15 },
});
