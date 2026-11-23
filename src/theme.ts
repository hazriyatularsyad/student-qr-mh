import { Platform, type ViewStyle } from 'react-native';

// Gold base, cream primary, frosted-glass surfaces. Dark brown ink keeps text legible outdoors.
export const colors = {
  bg: 'transparent',
  surface: 'rgba(255,246,224,0.62)',
  sheet: 'rgba(255,246,224,0.94)',
  cream: '#FFF6E0',
  gold: '#C99A33',
  goldDeep: '#8A6414',
  ink: '#2E2208',
  muted: '#6B5420',
  accent: '#8A6414',
  ok: '#2F6B3A',
  warn: '#9A5B00',
  danger: '#A62B1F',
  line: 'rgba(255,255,255,0.72)',
};
export const gradient = ['#E9CF8C', '#D4A94F', '#C99A33'] as const;
export const radius = 16;

export const fonts = {
  display: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, "Times New Roman", serif' }),
};

export const glass: ViewStyle = {
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.line,
  shadowColor: '#5A4210',
  shadowOpacity: 0.18,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
  elevation: 3,
  ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(18px) saturate(140%)' } as ViewStyle) : {}),
};

// Primary action: cream fill, gold edge, dark text.
export const primaryButton: ViewStyle = {
  backgroundColor: colors.cream,
  borderWidth: 2,
  borderColor: colors.goldDeep,
};
