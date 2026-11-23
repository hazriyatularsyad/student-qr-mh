import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Icon, type IconName } from '@/components/Icon';
import { useWide } from '@/lib/layout';
import { glass, tones, type Tone } from '@/theme';

const GUTTER = 6;

// 2 columns on phones, 4 on wide screens. Negative margin cancels the outer gutter.
export const BentoGrid = ({ children }: { children: ReactNode }) => <View style={s.grid}>{children}</View>;

// Folder outline: a tall tab on the left that steps down to a lower shelf on the right.
export function folderPath(w: number, h: number, tab = 0.58, drop = 20, r = 22): string {
  const tabW = Math.max(r * 2, w * tab);
  const k = 20;
  const d = Math.min(drop, h / 3);
  return [
    `M ${r} 0`,
    `H ${tabW}`,
    `C ${tabW + k * 0.6} 0 ${tabW + k * 0.4} ${d} ${tabW + k} ${d}`,
    `H ${w - r}`,
    `Q ${w} ${d} ${w} ${d + r}`,
    `V ${h - r}`,
    `Q ${w} ${h} ${w - r} ${h}`,
    `H ${r}`,
    `Q 0 ${h} 0 ${h - r}`,
    `V ${r}`,
    `Q 0 0 ${r} 0`,
    'Z',
  ].join(' ');
}

type TileProps = {
  tone?: Tone;
  span?: 1 | 2 | 3 | 4;
  rows?: number;
  shape?: 'rect' | 'folder';
  onPress?: () => void;
  label?: string;
  children: ReactNode;
  style?: ViewStyle;
};

export function Tile({ tone = 'glass', span = 1, rows = 1, shape = 'rect', onPress, label, children, style }: TileProps) {
  const cols = useWide() ? 4 : 2;
  const [size, setSize] = useState({ w: 0, h: 0 });
  const width = `${(Math.min(span, cols) / cols) * 100}%` as `${number}%`;
  const t = tones[tone];
  const folder = shape === 'folder';
  const body = [
    s.tile,
    folder ? s.folderBody : tone === 'glass' ? glass : { backgroundColor: t.bg },
    { minHeight: 96 * rows + (rows - 1) * GUTTER * 2 },
    style,
  ];
  const inner = (
    <>
      {folder && size.w > 0 && (
        <Svg width={size.w} height={size.h} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Path d={folderPath(size.w, size.h)} fill={t.bg} />
        </Svg>
      )}
      {children}
    </>
  );
  const onLayout = folder ? (e: { nativeEvent: { layout: { width: number; height: number } } }) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height }) : undefined;
  return (
    <View style={{ width, padding: GUTTER }}>
      {onPress ? (
        <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} onLayout={onLayout}
          style={({ pressed }) => [...body, pressed && { opacity: 0.85, transform: [{ scale: 0.985 }] }]}>
          {inner}
        </Pressable>
      ) : (
        <View style={body} onLayout={onLayout}>{inner}</View>
      )}
    </View>
  );
}

// Black round badge with a white icon, as in the folder tiles.
export const IconBadge = ({ name, size = 44 }: { name: IconName; size?: number }) => (
  <View style={[s.badge, { width: size, height: size, borderRadius: size / 2 }]}>
    <Icon name={name} size={size * 0.5} color="#FFFFFF" />
  </View>
);

export const TileLabel = ({ tone = 'glass', children }: { tone?: Tone; children: ReactNode }) => (
  <Text style={[s.label, { color: tones[tone].sub }]}>{children}</Text>
);
export const TileValue = ({ tone = 'glass', children, size = 40 }: { tone?: Tone; children: ReactNode; size?: number }) => (
  <Text style={[s.value, { color: tones[tone].fg, fontSize: size, lineHeight: size + 4 }]}>{children}</Text>
);

export function Avatar({ name, seed }: { name: string; seed: string }) {
  const keys = ['teal', 'gold', 'coral', 'plum', 'forest'] as const;
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
  tile: { flex: 1, borderRadius: 24, padding: 16, justifyContent: 'space-between', gap: 8, overflow: 'hidden' },
  folderBody: { backgroundColor: 'transparent', paddingTop: 30 },
  label: { fontSize: 14, fontWeight: '700' },
  value: { fontWeight: '800', letterSpacing: -1 },
  badge: { backgroundColor: '#0A0A0B', alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800' },
});
