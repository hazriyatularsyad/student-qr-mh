import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { usePhotoUrl } from '@/lib/photo';
import type { CheckResult, Substitute } from '@/lib/types';
import { colors, radius, glass, primaryButton, fonts } from '@/theme';

type Props = {
  result: CheckResult;
  busy: boolean;
  error: string | null;
  onConfirm: (substitute?: Substitute) => void;
  onClose: () => void;
};

export function ConfirmSheet({ result, busy, error, onConfirm, onClose }: Props) {
  const [other, setOther] = useState(false);
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const photo = usePhotoUrl(result.student?.photo_url);
  const s = result.student;
  const tone = result.status === 'ready' ? colors.ok : result.status === 'duplicate' ? colors.warn : colors.danger;

  const banner = {
    ready: { icon: 'checkmark-circle', text: 'Siap dikonfirmasi' },
    duplicate: { icon: 'warning', text: 'Sudah dijemput' },
    rejected: { icon: 'close-circle', text: 'QR ditolak' },
  } as const;
  const b = banner[result.status];

  return (
    <View style={[styles.sheet, { borderTopColor: tone }]}>
      <View style={styles.banner}>
        <Icon name={b.icon} size={22} color={tone} />
        <Text style={[styles.bannerText, { color: tone }]}>{b.text}</Text>
      </View>
      {s && (
        <View style={styles.row}>
          {photo ? <Image source={{ uri: photo }} style={styles.photo} /> : <View style={[styles.photo, styles.noPhoto]} />}
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{s.full_name}</Text>
            <Text style={styles.meta}>Kelas {s.class_name}</Text>
          </View>
        </View>
      )}

      {result.status === 'ready' && result.guardian && (
        <Text style={styles.guardian}>Wali terdaftar: {result.guardian.full_name} ({result.guardian.relationship})</Text>
      )}
      {result.status !== 'ready' && <Text style={[styles.warning, { color: tone }]}>{result.message}</Text>}
      {result.status === 'duplicate' && result.previous_scanner_name && (
        <Text style={styles.meta}>
          Dijemput {result.previous_scanned_at ? new Date(result.previous_scanned_at).toLocaleTimeString('id-ID') : ''}, dipindai {result.previous_scanner_name}
        </Text>
      )}
      {error && <Text style={[styles.warning, { color: colors.danger }]}>{error}</Text>}

      {result.status === 'ready' && !other && (
        <>
          <Pressable style={[styles.btn, primaryButton]} disabled={busy} onPress={() => onConfirm(undefined)}>
            <Icon name="checkmark" size={22} color={colors.ink} />
            <Text style={[styles.btnText, { color: colors.ink }]}>Konfirmasi</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.ghost]} disabled={busy} onPress={() => setOther(true)}>
            <Icon name="person-add-outline" size={20} color={colors.ink} />
            <Text style={[styles.btnText, { color: colors.ink }]}>Dijemput orang lain</Text>
          </Pressable>
        </>
      )}

      {result.status === 'ready' && other && (
        <>
          <TextInput style={styles.input} placeholder="Nama penjemput" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Status (mis. paman, ojek langganan)" value={status} onChangeText={setStatus} />
          <Pressable
            style={[styles.btn, primaryButton]}
            disabled={busy}
            onPress={() => { if (name.trim() && status.trim()) onConfirm({ name: name.trim(), status: status.trim() }); }}
          >
            <Text style={[styles.btnText, { color: colors.ink }]}>Konfirmasi penjemput pengganti</Text>
          </Pressable>
        </>
      )}

      <Pressable style={styles.close} onPress={onClose}><Text style={styles.close_text}>Tutup</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { ...glass, backgroundColor: colors.sheet, width: '100%', maxWidth: 560, alignSelf: 'center', borderTopWidth: 6, padding: 20, gap: 12, borderTopLeftRadius: radius, borderTopRightRadius: radius },
  row: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  photo: { width: 72, height: 72, borderRadius: radius },
  noPhoto: { backgroundColor: colors.line },
  name: { fontSize: 26, fontWeight: '700', color: colors.ink, fontFamily: fonts.display },
  meta: { fontSize: 16, color: colors.muted },
  guardian: { fontSize: 18, color: colors.ink },
  warning: { fontSize: 18, fontWeight: '600' },
  btn: { minHeight: 56, borderRadius: radius, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  ghost: { backgroundColor: 'rgba(255,255,255,0.45)', borderWidth: 1, borderColor: colors.line },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  input: { minHeight: 52, borderWidth: 1, borderColor: colors.line, borderRadius: radius, paddingHorizontal: 14, fontSize: 17 },
  close: { alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  close_text: { fontSize: 16, fontWeight: '700', color: colors.muted },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bannerText: { fontSize: 15, fontWeight: '800' },
});
