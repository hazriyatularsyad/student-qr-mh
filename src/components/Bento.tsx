import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useWide } from '@/lib/layout';
import { glass, radius, tones, type Tone } from '@/theme';

const GUTTER = 6;

// 2 columns on phones, 4 on wide screens. Negative margin cancels the outer gutter.
export const BentoGrid = ({ children }: { children: ReactNode }) => <View style={s.grid}>{children}</View>;

type TileProps = {
  tone?: Tone;
  span?: 1 | 2 | 3 | 4;
  rows?: number;
  onPress?: () => void;
  label?: string;
  children: ReactNode;
  style?: ViewStyle;
};

export function Tile({ tone = 'glass', span = 1, rows = 1, onPress, label, children, style }: TileProps) {
  const cols = useWide() ? 4 : 2;
  const width = `${(Math.min(span, cols) / cols) * 100}%` as `${number}%`;
  const t = tones[tone];
  const body = [
    s.tile,
    tone === 'glass' ? glass : { backgroundColor: t.bg },
    { minHeight: 96 * rows + (rows - 1) * GUTTER * 2 },
    style,
  ];
  return (
    <View style={{ width, padding: GUTTER }}>
      {onPress ? (
        <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
          style={({ pressed }) => [...body, pressed && { opacity: 0.85, transform: [{ scale: 0.985 }] }]}>
          {children}
        </Pressable>
      ) : (
        <View style={body}>{children}</View>
      )}
    </View>
  );
}

export const TileLabel = ({ tone = 'glass', children }: { tone?: Tone; children: ReactNode }) => (
  <Text style={[s.label, { color: tones[tone].sub }]}>{children}</Text>
);
export const TileValue = ({ tone = 'glass', children, size = 40 }: { tone?: Tone; children: ReactNode; size?: number }) => (
  <Text style={[s.value, { color: tones[tone].fg, fontSize: size, lineHeight: size + 4 }]}>{children}</Text>
);

export function Avatar({ name, seed }: { name: string; seed: string }) {
  const keys = ['teal', 'indigo', 'coral', 'plum', 'forest'] as const;
  const h = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0);
  const t = tones[keys[h % keys.length]];
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <View style={[s.avatar, { backgroundColor: t.bg }]}>
      <Text style={[s.avatarText, { color: t.fg }]}>{initials}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', margin: -GUTTER },
  tile: { flex: 1, borderRadius: radius + 2, padding: 16, justifyContent: 'space-between', gap: 8, overflow: 'hidden' },
  label: { fontSize: 14, fontWeight: '700' },
  value: { fontWeight: '800', letterSpacing: -1 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800' },
});
