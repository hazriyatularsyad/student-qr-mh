import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { colors, fonts, glass, hairline, primaryButton, radius } from '@/theme';

export const Field = (p: TextInputProps) => <TextInput placeholderTextColor={colors.muted} {...p} style={[s.input, p.style]} />;

export const Btn = ({ label, onPress, tone, disabled }: { label: string; onPress: () => void; tone?: string; disabled?: boolean }) => (
  <Pressable onPress={onPress} disabled={disabled} style={[s.btn, tone ? { backgroundColor: tone } : primaryButton, { opacity: disabled ? 0.5 : 1 }]}>
    <Text style={[s.btnText, !tone && { color: colors.ink }]}>{label}</Text>
  </Pressable>
);

export const Panel = ({ children, style }: { children: ReactNode; style?: ViewStyle }) => (
  <View style={[s.panel, style]}>{children}</View>
);

export const Heading = ({ children }: { children: ReactNode }) => <Text style={s.heading}>{children}</Text>;

export const Separator = () => <View style={s.sep} />;

const s = StyleSheet.create({
  panel: { ...glass, borderRadius: radius, padding: 16, gap: 10 },
  heading: { fontFamily: fonts.display, fontSize: 28, fontWeight: '800', letterSpacing: -0.6, color: colors.ink },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: hairline },
  input: { minHeight: 50, ...glass, borderRadius: radius, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, fontSize: 16, color: colors.ink },
  btn: { minHeight: 52, borderRadius: radius, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
