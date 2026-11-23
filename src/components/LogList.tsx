import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { LogRow } from '@/lib/types';
import { colors, radius, glass } from '@/theme';

const tone = { verified: colors.ok, duplicate: colors.warn, rejected: colors.danger } as const;
const label = { verified: 'Terverifikasi', duplicate: 'Duplikat', rejected: 'Ditolak' } as const;

export function LogList({ rows }: { rows: LogRow[] }) {
  return (
    <FlatList
      data={rows}
      keyExtractor={(r) => r.id}
      ListEmptyComponent={<Text style={s.empty}>Belum ada catatan.</Text>}
      renderItem={({ item: r }) => (
        <View style={[s.card, { borderLeftColor: tone[r.status] }]}>
          <Text style={s.name}>{r.student_name ?? 'QR tidak dikenal'}</Text>
          {r.class_name && <Text style={s.meta}>NIS {r.student_nis} · Kelas {r.class_name}</Text>}
          {r.guardian_name && <Text style={s.meta}>Wali: {r.guardian_name} ({r.relationship})</Text>}
          {r.substitute_name && <Text style={s.sub}>Pengganti: {r.substitute_name} ({r.substitute_status})</Text>}
          <Text style={s.meta}>
            {label[r.status]} · {new Date(r.scanned_at).toLocaleTimeString('id-ID')} · {r.scanner_name}
          </Text>
        </View>
      )}
    />
  );
}

const s = StyleSheet.create({
  card: { ...glass, borderRadius: radius, borderLeftWidth: 6, padding: 14, marginBottom: 10, gap: 2 },
  name: { fontSize: 18, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 15, color: colors.muted },
  sub: { fontSize: 16, fontWeight: '600', color: colors.warn },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40, fontSize: 16 },
});
