import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Btn } from '@/components/form';
import { runImport, type ImportOutcome } from '@/lib/importFlow';
import { colors, fonts } from '@/theme';

export default function Import() {
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<ImportOutcome | null>(null);
  const [fail, setFail] = useState<string | null>(null);

  const pick = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: ['text/csv', 'text/comma-separated-values', 'text/plain', '*/*'] });
    if (r.canceled) return;
    setBusy(true); setOut(null); setFail(null);
    try {
      const text = await (await fetch(r.assets[0].uri)).text();
      setOut(await runImport(text));
    } catch { setFail('Impor gagal. Periksa koneksi lalu coba lagi. Tidak ada data yang tersimpan.'); }
    setBusy(false);
  };

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Text style={s.title}>Impor murid dari CSV</Text>
      <Text style={s.hint}>Kolom: nis, nama_murid, panggilan, kelas, nama_wali, hubungan, no_hp. Pemisah koma atau titik koma. Jika ada satu baris salah, tidak ada yang tersimpan.</Text>
      <Btn label={busy ? 'Memproses…' : 'Pilih file CSV'} onPress={pick} disabled={busy} />
      {fail && <Text style={s.err}>{fail}</Text>}
      {out?.kind === 'done' && (
        <Text style={s.ok}>{out.cards > 0 ? `Selesai. ${out.cards} kartu QR baru dibuat sebagai PDF. Token tidak bisa ditampilkan lagi.` : 'Selesai. Data diperbarui, tidak ada kartu QR baru.'}</Text>
      )}
      {out && out.kind !== 'done' && (
        <>
          <Text style={s.err}>Impor dibatalkan. Perbaiki baris berikut lalu coba lagi:</Text>
          {out.errors.map((e, i) => <Text key={i} style={s.err}>{e.row === 0 ? 'Header' : `Baris ${e.row}`}: {e.message}</Text>)}
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 16, gap: 12, backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '700', color: colors.ink, fontFamily: fonts.display },
  hint: { fontSize: 15, color: colors.muted },
  ok: { fontSize: 16, color: colors.ok },
  err: { fontSize: 16, color: colors.danger },
});
