import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BentoGrid, IconBadge, Tile, TileLabel, TileValue } from '@/components/Bento';
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
        <Tile tone="gold" shape="folder" style={s.folder}>
          <IconBadge name="checkmark-done" size={40} />
          <View>
            <TileValue tone="gold" size={34}>{sum.verified}</TileValue>
            <TileLabel tone="gold">Dijemput hari ini</TileLabel>
          </View>
        </Tile>
        <Tile tone="coral" shape="folder" style={s.folder}>
          <IconBadge name="copy" size={40} />
          <View>
            <TileValue tone="coral" size={34}>{sum.duplicate}</TileValue>
            <TileLabel tone="coral">Scan ganda</TileLabel>
          </View>
        </Tile>
        <Tile tone="plum" shape="folder" style={s.folder}>
          <IconBadge name="close-circle" size={40} />
          <View>
            <TileValue tone="plum" size={34}>{sum.rejected}</TileValue>
            <TileLabel tone="plum">QR ditolak</TileLabel>
          </View>
        </Tile>
        <Tile tone="teal" shape="folder" style={s.folder}>
          <IconBadge name="time" size={40} />
          <View>
            <Text style={s.last} numberOfLines={2}>{sum.last ? sum.last.student_name?.split(' ')[0] : 'Belum ada'}</Text>
            <TileLabel tone="teal">{sum.last ? `Terakhir, kelas ${sum.last.class_name}` : 'Terakhir dijemput'}</TileLabel>
          </View>
        </Tile>
      </BentoGrid>
      <Panel>
        <Field icon="search-outline" placeholder="Cari nama atau NIS" value={q} onChangeText={setQ} />
        <Field placeholder="Kelas" value={cls} onChangeText={setCls} autoCapitalize="characters" />
        <View style={s.chips}>
          {STATUSES.map((st) => (
            <Pressable key={st.label} onPress={() => setStatus(st.value)}
              style={[s.chip, status === st.value && { backgroundColor: colors.gold }]}>
              <Text style={[s.chipText, status === st.value && { color: colors.onBright }]}>{st.label}</Text>
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
  chip: { minHeight: 44, paddingHorizontal: 16, borderRadius: radius, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, justifyContent: 'center' },
  chipText: { fontSize: 15, fontWeight: '700', color: colors.ink },
  last: { color: colors.onBright, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  folder: { minHeight: 150, justifyContent: 'space-between' },
  error: { color: colors.danger, fontSize: 15 },
});
