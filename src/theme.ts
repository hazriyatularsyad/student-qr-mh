import { Platform, type ViewStyle } from 'react-native';

// Dark canvas with bright, saturated folder tiles. Bright tiles always carry black text.
export const colors = {
  bg: '#0A0A0B',
  surface: '#17171B',
  sheet: '#17171B',
  cream: '#26262C', // raised neutral (steppers, pills)
  gold: '#D8F264', // lime accent
  goldDeep: '#D8F264',
  navy: '#17171B',
  ink: '#FFFFFF', // primary text on dark
  muted: '#9BA1AB',
  accent: '#D8F264',
  onBright: '#0A0A0B', // text on bright tiles / buttons
  ok: '#8CF25C',
  warn: '#FF7B5C',
  danger: '#FF5E7E',
  line: '#2E2E35',
};
export const radius = 16;

export const fonts = {
  display: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }),
};
export const hairline = '#26262C';

// Dark card surface.
export const glass: ViewStyle = {
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: hairline,
};

// Primary action: lime fill, black text.
export const primaryButton: ViewStyle = {
  backgroundColor: colors.gold,
};

// Tile tones. Meaning: lime = picked up, green = active students, coral = duplicate, pink = rejected, teal = info.
export const tones = {
  glass: { bg: colors.surface, fg: '#FFFFFF', sub: '#9BA1AB' },
  gold: { bg: '#D8F264', fg: '#0A0A0B', sub: 'rgba(10,10,11,0.68)' },
  forest: { bg: '#8CF25C', fg: '#0A0A0B', sub: 'rgba(10,10,11,0.68)' },
  coral: { bg: '#FF7B5C', fg: '#0A0A0B', sub: 'rgba(10,10,11,0.7)' },
  plum: { bg: '#FF5E7E', fg: '#0A0A0B', sub: 'rgba(10,10,11,0.7)' },
  teal: { bg: '#33C9B8', fg: '#0A0A0B', sub: 'rgba(10,10,11,0.68)' },
  indigo: { bg: '#AFA2FF', fg: '#0A0A0B', sub: 'rgba(10,10,11,0.68)' },
  navy: { bg: '#17171B', fg: '#FFFFFF', sub: '#9BA1AB' },
} as const;
export type Tone = keyof typeof tones;
export const avatarTones: Tone[] = ['teal', 'gold', 'coral', 'plum', 'forest'];
