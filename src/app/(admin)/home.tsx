import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar, BentoGrid, IconBadge, Tile, TileLabel, TileValue } from '@/components/Bento';
import { getCounts } from '@/lib/admin';
import { listLogs } from '@/lib/logs';
import { useMyName } from '@/lib/profile';
import { summarize } from '@/lib/summary';
import { colors, tones } from '@/theme';

const longDate = () => new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

export default function Home() {
  const router = useRouter();
  const name = useMyName();
  const [counts, setCounts] = useState({ students: 0, staff: 0 });
  const [sum, setSum] = useState(summarize([]));
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [c, rows] = await Promise.all([getCounts(), listLogs({ date: today() })]);
      setCounts(c); setSum(summarize(rows)); setErr(null);
    } catch { setErr('Gagal memuat ringkasan. Periksa koneksi.'); }
  }, []);
  useEffect(() => { void load(); const t = setInterval(() => void load(), 20000); return () => clearInterval(t); }, [load]);

  const first = name?.split(/\s+/)[0] ?? '';
  const rows = [
    { icon: 'checkmark-circle-outline', label: 'Dijemput', sub: 'Hari ini', value: String(sum.verified) },
    { icon: 'copy-outline', label: 'Scan ganda', sub: 'Percobaan ulang', value: String(sum.duplicate) },
    { icon: 'close-circle-outline', label: 'QR ditolak', sub: 'Tidak dikenal', value: String(sum.rejected) },
    { icon: 'time-outline', label: 'Terakhir', sub: sum.last ? `Kelas ${sum.last.class_name}` : 'Belum ada', value: sum.last?.student_name?.split(' ')[0] ?? '-' },
  ] as const;

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <View style={s.greetRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.hello}>Halo, {first}</Text>
          <Text style={s.sub}>Selamat datang kembali</Text>
        </View>
        {name && <Avatar name={name} seed={name} />}
      </View>
      <Text style={s.date}>{longDate()}</Text>
      {err && <Text style={s.err}>{err}</Text>}

      <BentoGrid>
        <Tile tone="gold" shape="folder" style={s.folder}>
          <IconBadge name="checkmark-done" />
          <View>
            <TileValue tone="gold" size={34}>{sum.verified}</TileValue>
            <TileLabel tone="gold">Dijemput hari ini</TileLabel>
          </View>
        </Tile>
        <Tile tone="forest" shape="folder" style={s.folder} onPress={() => router.push('/students')} label="Buka daftar murid">
          <IconBadge name="school" />
          <View>
            <TileValue tone="forest" size={34}>{counts.students}</TileValue>
            <TileLabel tone="forest">Murid aktif</TileLabel>
          </View>
        </Tile>
        <Tile tone="coral" shape="folder" style={s.folder}>
          <IconBadge name="copy" />
          <View>
            <TileValue tone="coral" size={34}>{sum.duplicate}</TileValue>
            <TileLabel tone="coral">Scan ganda</TileLabel>
          </View>
        </Tile>
        <Tile tone="teal" shape="folder" style={s.folder} onPress={() => router.push('/staff')} label="Buka daftar petugas">
          <IconBadge name="people" />
          <View>
            <TileValue tone="teal" size={34}>{counts.staff}</TileValue>
            <TileLabel tone="teal">Akun aktif</TileLabel>
          </View>
        </Tile>
      </BentoGrid>

      <Text style={s.section}>Rincian hari ini</Text>
      <View style={s.stack}>
        <View style={[s.layer, { backgroundColor: tones.coral.bg, left: 22, right: 22, top: 0 }]} />
        <View style={[s.layer, { backgroundColor: tones.forest.bg, left: 11, right: 11, top: 12 }]} />
        <View style={s.front}>
          {rows.map((r, i) => (
            <View key={r.label} style={[s.row, i > 0 && s.rowLine]}>
              <IconBadge name={r.icon} size={42} />
              <View style={{ flex: 1 }}>
                <Text style={s.rowLabel}>{r.label}</Text>
                <Text style={s.rowSub}>{r.sub}</Text>
              </View>
              <Text style={s.rowValue} numberOfLines={1}>{r.value}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 12, paddingBottom: 32 },
  greetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 6, paddingTop: 6 },
  hello: { fontSize: 34, fontWeight: '800', letterSpacing: -0.8, color: colors.ink },
  sub: { fontSize: 15, color: colors.muted, marginTop: 2 },
  date: { fontSize: 14, fontWeight: '600', color: colors.muted, paddingHorizontal: 6, paddingTop: 10, paddingBottom: 12 },
  err: { color: colors.danger, fontSize: 15, fontWeight: '700', padding: 6 },
  folder: { minHeight: 170, justifyContent: 'space-between' },
  section: { fontSize: 20, fontWeight: '800', color: colors.ink, paddingHorizontal: 6, paddingTop: 22, paddingBottom: 12 },
  stack: { marginHorizontal: 6, paddingTop: 26 },
  layer: { position: 'absolute', height: 70, borderRadius: 26 },
  front: { backgroundColor: tones.gold.bg, borderRadius: 26, paddingHorizontal: 16, paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rowLine: { borderTopWidth: 1, borderTopColor: 'rgba(10,10,11,0.12)' },
  rowLabel: { fontSize: 16, fontWeight: '800', color: colors.onBright },
  rowSub: { fontSize: 13, color: 'rgba(10,10,11,0.65)' },
  rowValue: { fontSize: 20, fontWeight: '800', color: colors.onBright, maxWidth: 120 },
});
