import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BentoGrid, Tile, TileLabel, TileValue } from '@/components/Bento';
import { Icon } from '@/components/Icon';
import { getCounts } from '@/lib/admin';
import { listLogs } from '@/lib/logs';
import { summarize } from '@/lib/summary';
import { colors } from '@/theme';

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

export default function Home() {
  const router = useRouter();
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

  const pct = counts.students ? Math.min(100, Math.round((sum.verified / counts.students) * 100)) : 0;

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      {err && <Text style={s.err}>{err}</Text>}
      <BentoGrid>
        <Tile tone="teal" span={2} rows={2}>
          <TileLabel tone="teal">Dijemput hari ini</TileLabel>
          <View>
            <TileValue tone="teal" size={64}>{sum.verified}</TileValue>
            <Text style={s.of}>dari {counts.students} murid aktif ({pct}%)</Text>
          </View>
          <View style={s.barBg}><View style={[s.barFill, { width: `${pct}%` }]} /></View>
        </Tile>
        <Tile tone="coral">
          <TileLabel tone="coral">Scan ganda</TileLabel>
          <TileValue tone="coral">{sum.duplicate}</TileValue>
        </Tile>
        <Tile tone="plum">
          <TileLabel tone="plum">QR ditolak</TileLabel>
          <TileValue tone="plum">{sum.rejected}</TileValue>
        </Tile>
        <Tile tone="gold" onPress={() => router.push('/students')} label="Buka daftar murid">
          <Icon name="school" size={26} color={colors.ink} />
          <View>
            <TileValue tone="gold" size={34}>{counts.students}</TileValue>
            <TileLabel tone="gold">Murid aktif</TileLabel>
          </View>
        </Tile>
        <Tile tone="indigo" onPress={() => router.push('/staff')} label="Buka daftar petugas">
          <Icon name="people" size={26} color="#fff" />
          <View>
            <TileValue tone="indigo" size={34}>{counts.staff}</TileValue>
            <TileLabel tone="indigo">Akun aktif</TileLabel>
          </View>
        </Tile>
        <Tile tone="forest" onPress={() => router.push('/import')} label="Impor murid dari CSV">
          <Icon name="cloud-upload" size={26} color="#fff" />
          <TileValue tone="forest" size={20}>Impor CSV</TileValue>
        </Tile>
        <Tile onPress={() => router.push('/reports')} label="Buka laporan">
          <Icon name="bar-chart" size={26} color={colors.goldDeep} />
          <TileValue size={20}>Laporan</TileValue>
        </Tile>
      </BentoGrid>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 12 },
  of: { color: 'rgba(255,255,255,0.9)', fontSize: 16, fontWeight: '600' },
  barBg: { height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5, backgroundColor: '#fff' },
  err: { color: colors.danger, fontSize: 15, fontWeight: '700', padding: 6 },
});
