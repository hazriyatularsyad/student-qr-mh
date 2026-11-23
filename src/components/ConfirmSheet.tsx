import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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

  return (
    <View style={[styles.sheet, { borderTopColor: tone }]}>
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
            <Text style={[styles.btnText, { color: colors.ink }]}>Konfirmasi</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.ghost]} disabled={busy} onPress={() => setOther(true)}>
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

      <Pressable style={styles.close} onPress={onClose}><Text style={styles.meta}>Tutup</Text></Pressable>
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
  btn: { minHeight: 56, borderRadius: radius, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  ghost: { backgroundColor: 'rgba(255,255,255,0.45)', borderWidth: 1, borderColor: colors.line },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  input: { minHeight: 52, borderWidth: 1, borderColor: colors.line, borderRadius: radius, paddingHorizontal: 14, fontSize: 17 },
  close: { alignItems: 'center', padding: 8 },
});
