import { Pressable, StyleSheet, Text, TextInput, type TextInputProps } from 'react-native';
import { colors, radius, glass, primaryButton } from '@/theme';

export const Field = (p: TextInputProps) => <TextInput placeholderTextColor={colors.muted} {...p} style={[s.input, p.style]} />;

export const Btn = ({ label, onPress, tone, disabled }: { label: string; onPress: () => void; tone?: string; disabled?: boolean }) => (
  <Pressable onPress={onPress} disabled={disabled} style={[s.btn, tone ? { backgroundColor: tone } : primaryButton, { opacity: disabled ? 0.5 : 1 }]}>
    <Text style={[s.btnText, !tone && { color: colors.ink }]}>{label}</Text>
  </Pressable>
);

const s = StyleSheet.create({
  input: { minHeight: 50, ...glass, borderRadius: radius, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, fontSize: 16, color: colors.ink },
  btn: { minHeight: 52, borderRadius: radius, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
