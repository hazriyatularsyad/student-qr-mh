import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Field } from '@/components/form';
import { LogList } from '@/components/LogList';
import { listLogs } from '@/lib/logs';
import type { LogRow } from '@/lib/types';
import { colors } from '@/theme';

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

export default function Reports() {
  const [date, setDate] = useState(today());
  const [cls, setCls] = useState('');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<LogRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;
    try { setRows(await listLogs({ date: validDate, class: cls, status, q })); setErr(null); }
    catch { setErr('Gagal memuat laporan.'); }
  }, [date, cls, status, q]);
  useEffect(() => { void load(); }, [load]);

  return (
    <View style={s.wrap}>
      <Field placeholder="Tanggal (YYYY-MM-DD, kosong = semua)" value={date} onChangeText={setDate} />
      <Field placeholder="Kelas" value={cls} onChangeText={setCls} autoCapitalize="characters" />
      <Field placeholder="Status: verified / duplicate / rejected" value={status} onChangeText={setStatus} autoCapitalize="none" />
      <Field placeholder="Cari nama atau NIS" value={q} onChangeText={setQ} />
      {err && <Text style={s.err}>{err}</Text>}
      <LogList rows={rows} />
    </View>
  );
}

const s = StyleSheet.create({ wrap: { flex: 1, padding: 16, gap: 8, backgroundColor: colors.bg }, err: { color: colors.danger } });
