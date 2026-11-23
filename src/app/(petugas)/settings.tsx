import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Heading, Panel } from '@/components/form';
import { useAuth } from '@/lib/auth';
import { getSpeechOpts, getVoices, initVoices, setSpeechOpts, speechQueue } from '@/lib/tts';
import { colors, radius, glass, primaryButton } from '@/theme';

const KEY = 'speech-opts';
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(v * 100) / 100));

export default function Settings() {
  const { signOut } = useAuth();
  const [rate, setRate] = useState(getSpeechOpts().rate);
  const [pitch, setPitch] = useState(getSpeechOpts().pitch);
  const [voice, setVoice] = useState(getSpeechOpts().voice);
  const [voiceCount, setVoiceCount] = useState(getVoices().length);

  useEffect(() => {
    void initVoices().then(() => {
      const o = getSpeechOpts();
      setRate(o.rate); setPitch(o.pitch); setVoice(o.voice); setVoiceCount(getVoices().length);
    });
  }, []);

  const update = (next: { rate: number; pitch: number }) => {
    setRate(next.rate); setPitch(next.pitch); setSpeechOpts(next);
    AsyncStorage.setItem(KEY, JSON.stringify({ ...next, voice })).catch(() => {});
  };

  const Stepper = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <View style={s.row}>
      <Text style={s.label}>{label}: {value.toFixed(2)}</Text>
      <Pressable style={s.step} onPress={() => onChange(clamp(value - 0.05, 0.5, 1.5))}><Text style={s.stepText}>−</Text></Pressable>
      <Pressable style={s.step} onPress={() => onChange(clamp(value + 0.05, 0.5, 1.5))}><Text style={s.stepText}>+</Text></Pressable>
    </View>
  );

  return (
    <View style={s.wrap}>
      <Heading>Pengaturan suara</Heading>
      <Panel>
      <Stepper label="Kecepatan suara" value={rate} onChange={(v) => update({ rate: v, pitch })} />
      <Stepper label="Nada suara" value={pitch} onChange={(v) => update({ rate, pitch: v })} />
      <Text style={s.label}>
        {voiceCount === 0 ? 'Suara Indonesia belum terpasang di HP ini. Pasang lewat Pengaturan HP > Text-to-speech.' : `Suara: ${getVoices().find((v) => v.identifier === voice)?.name ?? voice} (${voiceCount} tersedia)`}
      </Text>
      {voiceCount > 1 && (
        <Pressable style={s.btn} onPress={() => {
          const list = getVoices();
          const next = list[(list.findIndex((v) => v.identifier === voice) + 1) % list.length];
          setSpeechOpts({ voice: next.identifier }); setVoice(next.identifier);
          AsyncStorage.setItem(KEY, JSON.stringify({ rate, pitch, voice: next.identifier })).catch(() => {});
        }}>
          <Text style={s.btnText}>Ganti suara</Text>
        </Pressable>
      )}
      <Pressable style={s.btn} onPress={() => speechQueue.enqueue('Tes speaker. Aksa, kelas tiga A, sudah dijemput.')}>
        <Text style={s.btnText}>Tes Speaker</Text>
      </Pressable>
      </Panel>
      <Pressable style={s.btn} onPress={() => void signOut()}>
        <Text style={s.btnText}>Keluar</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 20, gap: 16, backgroundColor: colors.bg },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { flex: 1, fontSize: 17, color: colors.ink },
  step: { width: 52, height: 52, borderRadius: radius, ...glass, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line },
  stepText: { fontSize: 24, color: colors.ink },
  btn: { minHeight: 56, borderRadius: radius, ...primaryButton, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: colors.ink, fontSize: 18, fontWeight: '700' },
});
