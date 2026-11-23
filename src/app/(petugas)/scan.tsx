import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Icon } from '@/components/Icon';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { checkPickup, confirmPickup } from '@/lib/pickup';
import { createScanGate } from '@/lib/scanGate';
import { buildAnnouncement } from '@/lib/speech';
import { initVoices, speechQueue } from '@/lib/tts';
import type { CheckResult, Substitute } from '@/lib/types';
import { colors, primaryButton } from '@/theme';

export default function Scan() {
  const [permission, requestPermission] = useCameraPermissions();
  const gate = useRef(createScanGate()).current;
  const busyRef = useRef(false);
  useEffect(() => { void initVoices(); }, []);
  const [token, setToken] = useState<string | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => { setResult(null); setToken(null); setError(null); busyRef.current = false; };

  const onCode = async (value: string) => {
    if (busyRef.current || !gate.accept(value)) return;
    busyRef.current = true;
    try {
      setResult(await checkPickup(value));
      setToken(value);
    } catch {
      setResult({ status: 'rejected', message: 'Gagal terhubung. Coba pindai lagi.' });
    }
  };

  const confirm = async (substitute?: Substitute) => {
    if (!token || confirming) return;
    setConfirming(true);
    setError(null);
    try {
      const r = await confirmPickup(token, substitute);
      if (r.status === 'verified' && r.student) {
        speechQueue.enqueue(buildAnnouncement(r.student));
        close();
      } else {
        setResult({ ...r, status: r.status === 'duplicate' ? 'duplicate' : 'rejected' });
      }
    } catch {
      setError('Gagal terhubung. Penjemputan belum tercatat, coba lagi.');
    } finally {
      setConfirming(false);
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Icon name="camera-outline" size={44} color={colors.goldDeep} />
        <Text style={styles.text}>Aplikasi butuh izin kamera untuk memindai QR.</Text>
        <Pressable style={styles.btn} onPress={() => void requestPermission()}><Text style={styles.btnText}>Izinkan kamera</Text></Pressable>
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={result ? undefined : ({ data }) => { if (data) void onCode(data); }}
      />
      {!result && (
        <View pointerEvents="none" style={styles.frameWrap}>
          <View style={styles.frame}>
            <View style={[styles.corner, { top: 0, left: 0, borderTopWidth: 5, borderLeftWidth: 5 }]} />
            <View style={[styles.corner, { top: 0, right: 0, borderTopWidth: 5, borderRightWidth: 5 }]} />
            <View style={[styles.corner, { bottom: 0, left: 0, borderBottomWidth: 5, borderLeftWidth: 5 }]} />
            <View style={[styles.corner, { bottom: 0, right: 0, borderBottomWidth: 5, borderRightWidth: 5 }]} />
          </View>
          <Text style={styles.hint}>Arahkan kamera ke QR kartu wali</Text>
        </View>
      )}
      <Pressable accessibilityRole="button" accessibilityLabel="Ulangi Suara" style={styles.repeat} onPress={() => speechQueue.repeatLast()}>
        <Icon name="volume-high-outline" size={20} color={colors.ink} />
        <Text style={styles.repeatText}>Ulangi Suara</Text>
      </Pressable>
      {result && (
        <View style={styles.sheetWrap}>
          <ConfirmSheet result={result} busy={confirming} error={error} onConfirm={confirm} onClose={close} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, backgroundColor: colors.bg },
  text: { fontSize: 18, color: colors.ink, textAlign: 'center' },
  btn: { minHeight: 52, borderRadius: 14, ...primaryButton, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: colors.ink, fontSize: 17, fontWeight: '700' },
  frameWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: 18 },
  frame: { width: 240, height: 240 },
  corner: { position: 'absolute', width: 44, height: 44, borderColor: colors.cream, borderRadius: 6 },
  hint: { color: colors.cream, fontSize: 16, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 6 },
  repeatText: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  repeat: { position: 'absolute', top: 16, right: 16, minHeight: 44, flexDirection: 'row', gap: 6, borderRadius: 22, backgroundColor: colors.sheet, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  sheetWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
});
