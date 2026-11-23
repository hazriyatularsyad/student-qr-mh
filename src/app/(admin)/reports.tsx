import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { Btn, Field, Panel } from '@/components/form';
import { LogList } from '@/components/LogList';
import { listLogs } from '@/lib/logs';
import { downloadReport } from '@/lib/reportPdf';
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
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;
    try { setRows(await listLogs({ date: validDate, class: cls, status, q })); setErr(null); }
    catch { setErr('Gagal memuat laporan.'); }
  }, [date, cls, status, q]);
  useEffect(() => { void load(); }, [load]);

  const exportPdf = async () => {
    setNote(null);
    if (rows.length === 0) { setNote('Tidak ada data untuk diunduh. Ubah filter dulu.'); return; }
    setBusy(true);
    try {
      await downloadReport(rows, {
        date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined,
        kelas: cls.trim() || undefined, status: status.trim() || undefined, q: q.trim() || undefined,
      });
    } catch { setNote('Gagal membuat PDF. Coba lagi.'); }
    setBusy(false);
  };

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Panel>
      <Field icon="calendar-outline" placeholder="Tanggal (YYYY-MM-DD, kosong = semua)" value={date} onChangeText={setDate} />
      <Field placeholder="Kelas" value={cls} onChangeText={setCls} autoCapitalize="characters" />
      <Field placeholder="Status: verified / duplicate / rejected" value={status} onChangeText={setStatus} autoCapitalize="none" />
      <Field icon="search-outline" placeholder="Cari nama atau NIS" value={q} onChangeText={setQ} />
      </Panel>
      <Btn icon="document-text-outline" label={busy ? 'Membuat PDF…' : 'Unduh PDF'} onPress={exportPdf} disabled={busy} />
      {note && <Text style={s.err}>{note}</Text>}
      {err && <Text style={s.err}>{err}</Text>}
      <LogList rows={rows} inline />
    </ScrollView>
  );
}

const s = StyleSheet.create({ wrap: { flex: 1, padding: 16, gap: 8, backgroundColor: colors.bg }, err: { color: colors.danger } });
