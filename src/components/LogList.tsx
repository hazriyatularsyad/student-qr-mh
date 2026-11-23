import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Separator } from '@/components/form';
import { Icon } from '@/components/Icon';
import type { LogRow } from '@/lib/types';
import { colors, glass, radius } from '@/theme';

const tone = { verified: colors.ok, duplicate: colors.warn, rejected: colors.danger } as const;
const icon = { verified: 'checkmark-circle', duplicate: 'warning', rejected: 'close-circle' } as const;
const label = { verified: 'Terverifikasi', duplicate: 'Duplikat', rejected: 'Ditolak' } as const;
const time = (iso: string) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

export function LogList({ rows }: { rows: LogRow[] }) {
  return (
    <FlatList
      style={s.list}
      data={rows}
      keyExtractor={(r) => r.id}
      ItemSeparatorComponent={Separator}
      ListEmptyComponent={<View style={s.emptyBox}><Icon name="documents-outline" size={36} color={colors.muted} /><Text style={s.empty}>Belum ada catatan untuk filter ini.</Text></View>}
      renderItem={({ item: r }) => (
        <View style={s.row}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={s.name}>{r.student_name ?? 'QR tidak dikenal'}</Text>
            {r.class_name && <Text style={s.meta}>Kelas {r.class_name}, NIS {r.student_nis}</Text>}
            {r.guardian_name && <Text style={s.meta}>Wali: {r.guardian_name} ({r.relationship})</Text>}
            {r.substitute_name && <Text style={s.sub}>Pengganti: {r.substitute_name} ({r.substitute_status})</Text>}
          </View>
          <View style={s.side}>
            <View style={s.statusRow}>
              <Icon name={icon[r.status]} size={16} color={tone[r.status]} />
              <Text style={[s.status, { color: tone[r.status] }]}>{label[r.status]}</Text>
            </View>
            <Text style={s.meta}>{time(r.scanned_at)}</Text>
            <Text style={s.meta}>{r.scanner_name}</Text>
          </View>
        </View>
      )}
    />
  );
}

const s = StyleSheet.create({
  list: { ...glass, borderRadius: radius, flexGrow: 0 },
  row: { flexDirection: 'row', gap: 12, padding: 16 },
  side: { alignItems: 'flex-end', gap: 2 },
  name: { fontSize: 18, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 14, color: colors.muted },
  sub: { fontSize: 15, fontWeight: '700', color: colors.warn },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  emptyBox: { alignItems: 'center', gap: 8, padding: 32 },
  status: { fontSize: 14, fontWeight: '800' },
  empty: { textAlign: 'center', color: colors.muted, fontSize: 16 },
});
