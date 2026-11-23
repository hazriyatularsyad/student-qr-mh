import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { colors, radius, glass, primaryButton, fonts } from '@/theme';

export default function Login() {
  const { signIn } = useAuth();
  const router = useRouter();
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
    <View style={s.wrap}>
      <Text style={s.title}>Penjemputan Murid</Text>
      <Text style={s.sub}>Masuk dengan akun petugas atau admin.</Text>
      <TextInput style={s.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={s.input} placeholder="Kata sandi" secureTextEntry value={password} onChangeText={setPassword} onSubmitEditing={submit} returnKeyType="go" />
      {error && <Text style={s.error}>{error}</Text>}
      <Pressable style={s.btn} disabled={busy} onPress={submit}><Text style={s.btnText}>Masuk</Text></Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', padding: 24, gap: 14, width: '100%', maxWidth: 440, alignSelf: 'center' },
  title: { fontSize: 34, fontWeight: '700', color: colors.ink, fontFamily: fonts.display },
  sub: { fontSize: 16, color: colors.muted, marginBottom: 8 },
  input: { minHeight: 54, ...glass, borderRadius: radius, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 16, fontSize: 17 },
  error: { color: colors.danger, fontSize: 16 },
  btn: { minHeight: 56, borderRadius: radius, ...primaryButton, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: colors.ink, fontSize: 18, fontWeight: '700' },
});
