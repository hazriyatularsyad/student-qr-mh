import { Pressable, StyleSheet, Text, TextInput, type TextInputProps } from 'react-native';
import { colors, radius } from '@/theme';

export const Field = (p: TextInputProps) => <TextInput placeholderTextColor={colors.muted} {...p} style={[s.input, p.style]} />;

export const Btn = ({ label, onPress, tone = colors.accent, disabled }: { label: string; onPress: () => void; tone?: string; disabled?: boolean }) => (
  <Pressable onPress={onPress} disabled={disabled} style={[s.btn, { backgroundColor: tone, opacity: disabled ? 0.5 : 1 }]}>
    <Text style={s.btnText}>{label}</Text>
  </Pressable>
);

const s = StyleSheet.create({
  input: { minHeight: 50, backgroundColor: colors.surface, borderRadius: radius, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, fontSize: 16, color: colors.ink },
  btn: { minHeight: 52, borderRadius: radius, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
