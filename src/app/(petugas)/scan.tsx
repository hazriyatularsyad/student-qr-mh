import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { BentoGrid, Tile, TileLabel } from '@/components/Bento';
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
  const [last, setLast] = useState<string | null>(null);

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
        setLast(`${r.student.nickname?.trim() || r.student.full_name}, ${r.student.class_name}`);
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
        <Icon name="camera-outline" size={44} color={colors.gold} />
        <Text style={styles.text}>Aplikasi butuh izin kamera untuk memindai QR.</Text>
        <Pressable style={styles.btn} onPress={() => void requestPermission()}><Text style={styles.btnText}>Izinkan kamera</Text></Pressable>
      </View>
    );
  }

  return (
    <View style={styles.fill}>
      {result ? (
        <ConfirmSheet result={result} busy={confirming} error={error} onConfirm={confirm} onClose={close} />
      ) : (
        <>
          <View style={styles.cameraTile}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={({ data }) => { if (data) void onCode(data); }}
            />
            <View pointerEvents="none" style={styles.frameWrap}>
              <View style={styles.frame}>
                <View style={[styles.corner, { top: 0, left: 0, borderTopWidth: 5, borderLeftWidth: 5 }]} />
                <View style={[styles.corner, { top: 0, right: 0, borderTopWidth: 5, borderRightWidth: 5 }]} />
                <View style={[styles.corner, { bottom: 0, left: 0, borderBottomWidth: 5, borderLeftWidth: 5 }]} />
                <View style={[styles.corner, { bottom: 0, right: 0, borderBottomWidth: 5, borderRightWidth: 5 }]} />
              </View>
            </View>
          </View>
          <BentoGrid>
            <Tile tone="indigo" span={2} style={styles.hintTile}>
              <Icon name="scan-outline" size={22} color={colors.onBright} />
              <Text style={styles.hint}>Arahkan kamera ke QR kartu wali</Text>
            </Tile>
            <Tile tone="gold" onPress={() => speechQueue.repeatLast()} label="Ulangi Suara">
              <Icon name="volume-high-outline" size={24} color={colors.onBright} />
              <Text style={styles.tileText}>Ulangi Suara</Text>
            </Tile>
            <Tile tone="teal">
              <TileLabel tone="teal">Terakhir dijemput</TileLabel>
              <Text style={styles.lastText} numberOfLines={2}>{last ?? 'Belum ada'}</Text>
            </Tile>
          </BentoGrid>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, padding: 12, gap: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  text: { fontSize: 18, color: colors.ink, textAlign: 'center' },
  btn: { minHeight: 52, borderRadius: 14, ...primaryButton, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: colors.onBright, fontSize: 17, fontWeight: '700' },
  cameraTile: { flex: 1, minHeight: 240, borderRadius: 28, overflow: 'hidden', backgroundColor: '#1B1405' },
  frameWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  frame: { width: 220, height: 220 },
  corner: { position: 'absolute', width: 44, height: 44, borderColor: colors.gold, borderRadius: 6 },
  hintTile: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' },
  hint: { flex: 1, color: colors.onBright, fontSize: 16, fontWeight: '700' },
  tileText: { color: colors.onBright, fontSize: 16, fontWeight: '800' },
  lastText: { color: colors.onBright, fontSize: 17, fontWeight: '800' },
});
