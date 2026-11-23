import { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import QRCode from 'react-native-qrcode-svg';
import { Avatar, BentoGrid, IconBadge, Tile, TileLabel } from '@/components/Bento';
import { Btn, Field, Panel } from '@/components/form';
import { getGuardian, getQrToken, issueQr, listStudents, revokeQr, setStudentActive, uploadPhoto, type Guardian, type Student } from '@/lib/admin';
import { usePhotoUrl } from '@/lib/photo';
import { downloadQr } from '@/lib/qrDownload';
import { colors, radius } from '@/theme';

export default function StudentDetail() {
  const { nis } = useLocalSearchParams<{ nis: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [guardian, setGuardian] = useState<Guardian | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [form, setForm] = useState({ full_name: '', relationship: '', phone_number: '' });
  const [msg, setMsg] = useState<string | null>(null);
  const photo = usePhotoUrl(student?.photo_url);

  const load = useCallback(async () => {
    const [list, g] = await Promise.all([listStudents(nis), getGuardian(nis)]);
    setStudent(list.find((x) => x.nis === nis) ?? null);
    setGuardian(g);
    if (g) setForm({ full_name: g.full_name, relationship: g.relationship, phone_number: g.phone_number });
    setToken(g?.is_active ? await getQrToken(g.id) : null);
  }, [nis]);
  useEffect(() => { void load().catch(() => setMsg('Gagal memuat data murid.')); }, [load]);

  const issue = async () => {
    if (!form.full_name.trim() || !form.relationship.trim() || !form.phone_number.trim()) { setMsg('Data wali wajib diisi semua.'); return; }
    try {
      await issueQr(nis, form.full_name.trim(), form.relationship.trim(), form.phone_number.trim());
      setMsg('QR baru terbit. QR lama tidak berlaku lagi.');
      await load();
    } catch { setMsg('Gagal menerbitkan QR.'); }
  };

  const download = async () => {
    if (!token || !student) return;
    try { await downloadQr({ studentName: student.full_name, className: student.class_name, nis, token }); }
    catch { setMsg('Gagal mengunduh QR.'); }
  };

  const pickPhoto = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6, allowsEditing: true, aspect: [1, 1] });
    if (r.canceled) return;
    try { await uploadPhoto(nis, r.assets[0].uri); setMsg('Foto disimpan.'); await load(); } catch { setMsg('Gagal mengunggah foto.'); }
  };

  const active = student?.is_active ?? false;
  const guardianLive = !!guardian?.is_active;

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <BentoGrid>
        <Tile span={2}>
          <View style={s.idRow}>
            {photo ? <Image source={{ uri: photo }} style={s.photo} /> : <Avatar name={student?.full_name ?? nis} seed={nis} />}
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{student?.full_name ?? nis}</Text>
              <Text style={s.meta}>Kelas {student?.class_name ?? '-'}, NIS {nis}</Text>
              {student?.nickname ? <Text style={s.meta}>Dipanggil: {student.nickname}</Text> : null}
            </View>
            <View style={[s.pill, { backgroundColor: active ? colors.ok : colors.line }]}>
              <Text style={[s.pillText, { color: active ? colors.onBright : colors.muted }]}>{active ? 'Aktif' : 'Nonaktif'}</Text>
            </View>
          </View>
        </Tile>

        <Tile tone="teal" span={2} shape="folder" style={{ minHeight: 120 }}>
          <IconBadge name="people" size={40} />
          <View>
            <Text style={s.guardian}>{guardian ? guardian.full_name : 'Belum ada wali'}</Text>
            <TileLabel tone="teal">{guardian ? `${guardian.relationship}, ${guardian.phone_number}` : 'Isi data wali di bawah'}</TileLabel>
          </View>
        </Tile>

        <Tile tone="gold" span={2} style={{ gap: 12 }}>
          <TileLabel tone="gold">Kartu QR penjemputan</TileLabel>
          {token ? (
            <>
              <View style={s.qrBox}><QRCode value={token} size={200} backgroundColor="#FFFFFF" color="#0A0A0B" /></View>
              <Btn icon="download-outline" label="Unduh QR" onPress={download} />
            </>
          ) : (
            <Text style={s.noQr}>
              {guardianLive
                ? 'QR belum tersimpan untuk murid ini (diterbitkan sebelum penyimpanan token). Terbitkan ulang di bawah untuk mendapat QR yang bisa diunduh. QR lama berhenti berlaku.'
                : guardian ? 'QR sudah dicabut. Terbitkan ulang di bawah.' : 'Belum ada QR. Isi data wali di bawah, lalu terbitkan.'}
            </Text>
          )}
        </Tile>
      </BentoGrid>

      {msg && <Text style={s.msg}>{msg}</Text>}

      <Panel style={{ marginTop: 6 }}>
        <Text style={s.section}>Data wali</Text>
        <Field placeholder="Nama wali" value={form.full_name} onChangeText={(v) => setForm({ ...form, full_name: v })} />
        <Field placeholder="Hubungan (Ibu, Ayah, ...)" value={form.relationship} onChangeText={(v) => setForm({ ...form, relationship: v })} />
        <Field placeholder="Nomor HP" keyboardType="phone-pad" value={form.phone_number} onChangeText={(v) => setForm({ ...form, phone_number: v })} />
        <Btn icon="qr-code-outline" label={guardian ? 'Terbitkan ulang QR' : 'Terbitkan QR'} onPress={issue} />
        {guardianLive && <Btn label="Cabut QR" tone={colors.danger} onPress={async () => { await revokeQr(nis); await load(); }} />}
      </Panel>

      <Panel style={{ marginTop: 12 }}>
        <Text style={s.section}>Murid</Text>
        <Btn icon="image-outline" label="Pilih foto murid" onPress={pickPhoto} />
        <Btn label={active ? 'Nonaktifkan murid' : 'Aktifkan murid'} tone={colors.warn}
          onPress={async () => { await setStudentActive(nis, !active); await load(); }} />
      </Panel>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 12, paddingBottom: 32 },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  photo: { width: 52, height: 52, borderRadius: 26 },
  name: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4, color: colors.ink },
  meta: { fontSize: 14, color: colors.muted },
  pill: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: 12, fontWeight: '800' },
  guardian: { fontSize: 22, fontWeight: '800', color: colors.onBright },
  qrBox: { alignSelf: 'center', backgroundColor: '#FFFFFF', padding: 14, borderRadius: radius },
  noQr: { fontSize: 15, lineHeight: 21, color: colors.onBright, fontWeight: '600' },
  msg: { color: colors.gold, fontSize: 15, fontWeight: '700', padding: 6 },
  section: { fontSize: 18, fontWeight: '800', color: colors.ink },
});
