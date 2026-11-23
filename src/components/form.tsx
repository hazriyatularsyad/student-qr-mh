import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/components/Icon';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { colors, fonts, glass, hairline, primaryButton, radius } from '@/theme';

export const Field = ({ icon, ...p }: TextInputProps & { icon?: IconName }) => (
  <View>
    {icon && <View style={s.fieldIcon} pointerEvents="none"><Icon name={icon} size={20} color={colors.muted} /></View>}
    <TextInput placeholderTextColor={colors.muted} {...p} style={[s.input, icon && { paddingLeft: 44 }, p.style]} />
  </View>
);

export const Btn = ({ label, onPress, tone, disabled, icon }: { label: string; onPress: () => void; tone?: string; disabled?: boolean; icon?: IconName }) => (
  <Pressable onPress={onPress} disabled={disabled} style={[s.btn, tone ? { backgroundColor: tone } : primaryButton, { opacity: disabled ? 0.5 : 1 }]}>
    {icon && <Icon name={icon} size={20} color="#fff" />}
    <Text style={s.btnText}>{label}</Text>
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
  fieldIcon: { position: 'absolute', left: 14, top: 0, bottom: 0, justifyContent: 'center', zIndex: 1 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: hairline },
  input: { minHeight: 50, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.line, borderRadius: 12, paddingHorizontal: 14, fontSize: 16, color: colors.ink },
  btn: { minHeight: 52, borderRadius: radius, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
