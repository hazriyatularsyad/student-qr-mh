import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import QRCode from 'react-native-qrcode-svg';
import { Btn, Field } from '@/components/form';
import { getGuardian, issueQr, listStudents, revokeQr, setStudentActive, uploadPhoto, type Student } from '@/lib/admin';
import { buildCardsHtml } from '@/lib/cards';
import { colors } from '@/theme';

export default function StudentDetail() {
  const { nis } = useLocalSearchParams<{ nis: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [g, setG] = useState({ full_name: '', relationship: '', phone_number: '' });
  const [hasGuardian, setHasGuardian] = useState(false);
  const [active, setActive] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    const [list, guardian] = await Promise.all([listStudents(nis), getGuardian(nis)]);
    setStudent(list.find((x) => x.nis === nis) ?? null);
    if (guardian) { setG({ full_name: guardian.full_name, relationship: guardian.relationship, phone_number: guardian.phone_number }); setActive(guardian.is_active); }
    setHasGuardian(!!guardian);
  };
  useEffect(() => { void load().catch(() => setMsg('Gagal memuat data.')); }, [nis]);

  const issue = async () => {
    if (!g.full_name.trim() || !g.relationship.trim() || !g.phone_number.trim()) { setMsg('Data wali wajib diisi semua.'); return; }
    try {
      setToken(await issueQr(nis, g.full_name.trim(), g.relationship.trim(), g.phone_number.trim()));
      setMsg('QR baru terbit. QR lama tidak berlaku lagi. Token hanya tampil sekali.');
      void load();
    } catch { setMsg('Gagal menerbitkan QR.'); }
  };

  const share = async () => {
    if (!token || !student) return;
    const html = await buildCardsHtml([{ studentName: student.full_name, className: student.class_name, nis, token }]);
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  };

  const pickPhoto = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6, allowsEditing: true, aspect: [1, 1] });
    if (r.canceled) return;
    try { await uploadPhoto(nis, r.assets[0].uri); setMsg('Foto disimpan.'); } catch { setMsg('Gagal mengunggah foto.'); }
  };

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Text style={s.title}>{student?.full_name ?? nis}</Text>
      <Text style={s.meta}>NIS {nis} · Kelas {student?.class_name}</Text>
      <Btn label="Pilih foto murid" onPress={pickPhoto} tone={colors.muted} />
      <Btn label={student?.is_active ? 'Nonaktifkan murid' : 'Aktifkan murid'} tone={colors.warn}
        onPress={async () => { if (student) { await setStudentActive(nis, !student.is_active); void load(); } }} />

      <Text style={s.section}>Wali & QR {hasGuardian ? (active ? '(aktif)' : '(dicabut)') : '(belum ada)'}</Text>
      <Field placeholder="Nama wali" value={g.full_name} onChangeText={(v) => setG({ ...g, full_name: v })} />
      <Field placeholder="Hubungan (Ibu, Ayah, ...)" value={g.relationship} onChangeText={(v) => setG({ ...g, relationship: v })} />
      <Field placeholder="Nomor HP" keyboardType="phone-pad" value={g.phone_number} onChangeText={(v) => setG({ ...g, phone_number: v })} />
      <Btn label={hasGuardian ? 'Terbitkan ulang QR' : 'Terbitkan QR'} onPress={issue} />
      {hasGuardian && active && (
        <Btn label="Cabut QR" tone={colors.danger} onPress={async () => { await revokeQr(nis); setToken(null); void load(); }} />
      )}
      {msg && <Text style={s.msg}>{msg}</Text>}
      {token && (
        <View style={s.qr}>
          <QRCode value={token} size={220} />
          <Btn label="Bagikan kartu (PDF)" onPress={share} />
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 16, gap: 10, backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '800', color: colors.ink },
  meta: { fontSize: 15, color: colors.muted },
  section: { fontSize: 18, fontWeight: '700', color: colors.ink, marginTop: 12 },
  msg: { color: colors.accent, fontSize: 15 },
  qr: { alignItems: 'center', gap: 12, marginTop: 8 },
});
