import { Platform, type ViewStyle } from 'react-native';

// Corporate palette: navy brand, white surfaces, cool grey canvas, pearl-gold accent.
export const colors = {
  bg: '#F4F6FA',
  surface: '#FFFFFF',
  sheet: '#FFFFFF',
  cream: '#EEF2F9', // light neutral tint (steppers, pills)
  gold: '#C9962B',
  goldDeep: '#9A6B00',
  navy: '#14274E',
  ink: '#0F172A',
  muted: '#5B6B82',
  accent: '#2563EB',
  ok: '#12794A',
  warn: '#B26A00',
  danger: '#C93550',
  line: '#D8DFEA',
};
export const radius = 14;

// System sans only: weight and size carry the hierarchy.
export const fonts = {
  display: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }),
};
export const hairline = '#E3E8F0';

// Card surface: white, thin border, soft layered shadow.
export const glass: ViewStyle = {
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: hairline,
  shadowColor: '#0F172A',
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
};

// Primary action: solid navy, white text.
export const primaryButton: ViewStyle = {
  backgroundColor: colors.navy,
};

// Tile tones. Meaning: emerald = done, rose = duplicate, violet = rejected.
export const tones = {
  glass: { bg: colors.surface, fg: colors.ink, sub: colors.muted },
  gold: { bg: '#F2B53A', fg: '#2B1D00', sub: '#5C4300' },
  teal: { bg: '#0B7A7C', fg: '#FFFFFF', sub: 'rgba(255,255,255,0.86)' },
  indigo: { bg: '#2C4DB5', fg: '#FFFFFF', sub: 'rgba(255,255,255,0.86)' },
  coral: { bg: '#C93550', fg: '#FFFFFF', sub: 'rgba(255,255,255,0.88)' },
  plum: { bg: '#6B46C1', fg: '#FFFFFF', sub: 'rgba(255,255,255,0.86)' },
  forest: { bg: '#12794A', fg: '#FFFFFF', sub: 'rgba(255,255,255,0.86)' },
  navy: { bg: '#14274E', fg: '#FFFFFF', sub: 'rgba(255,255,255,0.8)' },
} as const;
export type Tone = keyof typeof tones;
export const avatarTones: Tone[] = ['teal', 'indigo', 'coral', 'plum', 'forest'];
