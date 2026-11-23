import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BentoGrid, Tile, TileLabel } from '@/components/Bento';
import { Icon } from '@/components/Icon';
import { usePhotoUrl } from '@/lib/photo';
import type { CheckResult, Substitute } from '@/lib/types';
import { colors, radius, tones } from '@/theme';

type Props = {
  result: CheckResult;
  busy: boolean;
  error: string | null;
  onConfirm: (substitute?: Substitute) => void;
  onClose: () => void;
};

const STATUS = {
  ready: { tone: 'forest', icon: 'checkmark-circle', text: 'Siap dikonfirmasi' },
  duplicate: { tone: 'coral', icon: 'warning', text: 'Sudah dijemput' },
  rejected: { tone: 'plum', icon: 'close-circle', text: 'QR ditolak' },
} as const;

// Takes the place of the camera tile: nothing floats over anything else.
export function ConfirmSheet({ result, busy, error, onConfirm, onClose }: Props) {
  const [other, setOther] = useState(false);
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');
  const photo = usePhotoUrl(result.student?.photo_url);
  const s = result.student;
  const st = STATUS[result.status];
  const fg = tones[st.tone].fg;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <BentoGrid>
        <Tile tone={st.tone} span={2}>
          <View style={styles.row}>
            <Icon name={st.icon} size={26} color={fg} />
            <Text style={[styles.banner, { color: fg }]}>{st.text}</Text>
          </View>
          {result.status !== 'ready' && <Text style={[styles.body, { color: fg }]}>{result.message}</Text>}
          {result.status === 'duplicate' && result.previous_scanner_name && (
            <TileLabel tone={st.tone}>
              Dijemput {result.previous_scanned_at ? new Date(result.previous_scanned_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}, dipindai {result.previous_scanner_name}
            </TileLabel>
          )}
          {error && <Text style={[styles.body, { color: fg, fontWeight: '800' }]}>{error}</Text>}
        </Tile>

        {s && (
          <Tile span={2}>
            <View style={styles.row}>
              {photo ? <Image source={{ uri: photo }} style={styles.photo} /> : (
                <View style={[styles.photo, styles.noPhoto]}><Icon name="person" size={34} color={colors.muted} /></View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{s.full_name}</Text>
                <Text style={styles.cls}>Kelas {s.class_name}</Text>
              </View>
            </View>
          </Tile>
        )}

        {result.status === 'ready' && result.guardian && (
          <Tile tone="indigo" span={2}>
            <View style={styles.row}>
              <Icon name="people" size={22} color={colors.onBright} />
              <Text style={styles.guardian}>Wali terdaftar: {result.guardian.full_name} ({result.guardian.relationship})</Text>
            </View>
          </Tile>
        )}

        {result.status === 'ready' && !other && (
          <>
            <Tile tone="forest" span={2} onPress={() => !busy && onConfirm(undefined)} label="Konfirmasi" style={styles.action}>
              <View style={styles.row}>
                <Icon name="checkmark" size={26} color={colors.onBright} />
                <Text style={styles.actionText}>Konfirmasi</Text>
              </View>
            </Tile>
            <Tile span={2} onPress={() => !busy && setOther(true)} label="Dijemput orang lain" style={styles.action}>
              <View style={styles.row}>
                <Icon name="person-add-outline" size={22} color={colors.ink} />
                <Text style={[styles.actionText, { color: colors.ink }]}>Dijemput orang lain</Text>
              </View>
            </Tile>
          </>
        )}

        {result.status === 'ready' && other && (
          <Tile span={2} style={{ gap: 10 }}>
            <TextInput style={styles.input} placeholder="Nama penjemput" placeholderTextColor={colors.muted} value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Status (mis. paman, ojek langganan)" placeholderTextColor={colors.muted} value={status} onChangeText={setStatus} />
            <Pressable
              accessibilityRole="button"
              style={[styles.submit, (!name.trim() || !status.trim()) && { opacity: 0.55 }]}
              disabled={busy}
              onPress={() => { if (name.trim() && status.trim()) onConfirm({ name: name.trim(), status: status.trim() }); }}
            >
              <Icon name="checkmark" size={22} color={colors.onBright} />
              <Text style={styles.actionText}>Konfirmasi penjemput pengganti</Text>
            </Pressable>
          </Tile>
        )}

        <Tile span={2} onPress={onClose} label="Tutup" style={styles.closeTile}>
          <Text style={styles.closeText}>Tutup</Text>
        </Tile>
      </BentoGrid>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 6, paddingBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  banner: { fontSize: 20, fontWeight: '800' },
  body: { fontSize: 16, lineHeight: 22 },
  photo: { width: 76, height: 76, borderRadius: radius },
  noPhoto: { backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, color: colors.ink },
  cls: { fontSize: 18, fontWeight: '700', color: colors.gold },
  guardian: { flex: 1, fontSize: 17, fontWeight: '700', color: colors.onBright },
  action: { minHeight: 68, justifyContent: 'center' },
  actionText: { fontSize: 19, fontWeight: '800', color: colors.onBright },
  input: { minHeight: 52, backgroundColor: colors.cream, borderRadius: radius, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, fontSize: 16, color: colors.ink },
  submit: { minHeight: 56, borderRadius: radius, backgroundColor: tones.forest.bg, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  closeTile: { minHeight: 52, justifyContent: 'center', alignItems: 'center' },
  closeText: { fontSize: 16, fontWeight: '800', color: colors.muted },
});
