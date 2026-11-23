import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/Icon';
import { useAuth } from '@/lib/auth';
import { useWide } from '@/lib/layout';
import { colors, radius, glass, primaryButton, fonts } from '@/theme';

export default function Login() {
  const { signIn } = useAuth();
  const router = useRouter();
  const wide = useWide();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    const err = await signIn(email.trim(), password);
    setError(err);
    setBusy(false);
    if (!err) router.replace('/');
  };

  return (
    <View style={[s.wrap, wide && { flexDirection: 'row', alignItems: 'center', maxWidth: 980 }]}>
      <View style={[s.intro, wide && { flex: 1, paddingRight: 48 }]}>
        <View style={s.logo}><Icon name="qr-code" size={30} color={colors.goldDeep} /></View>
        <Text style={s.title}>Penjemputan{'\n'}murid</Text>
        <Text style={s.sub}>Pindai kartu QR wali, konfirmasi, dan nama murid diumumkan lewat speaker gerbang.</Text>
      </View>
      <View style={[s.form, wide && { width: 380 }]}>
        <Text style={s.label}>Email</Text>
        <TextInput style={s.input} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} accessibilityLabel="Email" placeholder="Email" />
        <Text style={s.label}>Kata sandi</Text>
        <TextInput style={s.input} secureTextEntry value={password} onChangeText={setPassword} onSubmitEditing={submit} returnKeyType="go" accessibilityLabel="Kata sandi" placeholder="Kata sandi" />
        {error && <Text style={s.error}>{error}</Text>}
        <Pressable style={s.btn} disabled={busy} onPress={submit}><Text style={s.btnText}>Masuk</Text></Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', padding: 24, gap: 28, width: '100%', maxWidth: 480, alignSelf: 'center' },
  intro: { gap: 12 },
  logo: { width: 56, height: 56, borderRadius: radius, alignItems: 'center', justifyContent: 'center', ...glass },
  title: { fontFamily: fonts.display, fontSize: 44, lineHeight: 46, fontWeight: '800', letterSpacing: -1.2, color: colors.ink },
  sub: { fontSize: 17, lineHeight: 24, color: colors.muted, maxWidth: 420 },
  form: { ...glass, borderRadius: radius, padding: 20, gap: 8 },
  label: { fontSize: 14, fontWeight: '700', color: colors.ink, marginTop: 4 },
  input: { minHeight: 52, backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: radius, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 16, fontSize: 17, color: colors.ink },
  error: { color: colors.danger, fontSize: 15, fontWeight: '600' },
  btn: { minHeight: 56, ...primaryButton, borderRadius: radius, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  btnText: { color: colors.ink, fontSize: 18, fontWeight: '800' },
});
