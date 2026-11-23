import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BentoGrid, Tile, TileLabel, TileValue } from '@/components/Bento';
import { Icon } from '@/components/Icon';
import { getSpeechOpts, getVoices, initVoices, setSpeechOpts, speechQueue } from '@/lib/tts';
import { colors, tones, type Tone } from '@/theme';

const KEY = 'speech-opts';
const clamp = (v: number) => Math.min(1.5, Math.max(0.5, Math.round(v * 100) / 100));

function Stepper({ tone, label, value, onChange }: { tone: Tone; label: string; value: number; onChange: (v: number) => void }) {
  return (
    <Tile tone={tone} rows={2}>
      <TileLabel tone={tone}>{label}</TileLabel>
      <TileValue tone={tone} size={38}>{value.toFixed(2)}</TileValue>
      <View style={s.steps}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Kurangi ${label}`} style={s.step} onPress={() => onChange(clamp(value - 0.05))}>
          <Icon name="remove" size={26} color={colors.ink} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Tambah ${label}`} style={s.step} onPress={() => onChange(clamp(value + 0.05))}>
          <Icon name="add" size={26} color={colors.ink} />
        </Pressable>
      </View>
    </Tile>
  );
}

export default function Settings() {
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

  const save = (next: { rate: number; pitch: number; voice?: string }) => {
    setSpeechOpts(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  };
  const voiceName = getVoices().find((v) => v.identifier === voice)?.name ?? voice;

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <BentoGrid>
        <Stepper tone="indigo" label="Kecepatan" value={rate} onChange={(v) => { setRate(v); save({ rate: v, pitch, voice }); }} />
        <Stepper tone="plum" label="Nada" value={pitch} onChange={(v) => { setPitch(v); save({ rate, pitch: v, voice }); }} />
        <Tile tone="teal" span={2}>
          <TileLabel tone="teal">Suara</TileLabel>
          <Text style={s.voice}>
            {voiceCount === 0 ? 'Suara Indonesia belum terpasang di HP ini. Pasang lewat Pengaturan HP, Text-to-speech.' : `${voiceName} (${voiceCount} tersedia)`}
          </Text>
          {voiceCount > 1 && (
            <Pressable accessibilityRole="button" style={s.cream} onPress={() => {
              const list = getVoices();
              const next = list[(list.findIndex((v) => v.identifier === voice) + 1) % list.length];
              setVoice(next.identifier); save({ rate, pitch, voice: next.identifier });
            }}>
              <Icon name="swap-horizontal" size={20} color={colors.ink} />
              <Text style={s.creamText}>Ganti suara</Text>
            </Pressable>
          )}
        </Tile>
        <Tile tone="gold" span={2} onPress={() => speechQueue.enqueue('Tes speaker. Aksa, kelas tiga A, sudah dijemput.')} label="Tes Speaker" style={{ minHeight: 88, justifyContent: 'center' }}>
          <View style={s.testRow}>
            <Icon name="volume-high" size={28} color={tones.gold.fg} />
            <Text style={s.testText}>Tes Speaker</Text>
          </View>
        </Tile>
      </BentoGrid>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 12 },
  steps: { flexDirection: 'row', gap: 8 },
  step: { flex: 1, minHeight: 48, borderRadius: 14, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  voice: { color: colors.onBright, fontSize: 18, fontWeight: '700' },
  cream: { minHeight: 48, borderRadius: 14, backgroundColor: colors.cream, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  creamText: { fontSize: 16, fontWeight: '800', color: colors.ink },
  testRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  testText: { fontSize: 22, fontWeight: '800', color: colors.onBright },
});
