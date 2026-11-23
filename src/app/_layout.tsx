import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Slot } from 'expo-router';
import { AuthProvider } from '@/lib/auth';
import { gradient } from '@/theme';

export default function RootLayout() {
  return (
    <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill}>
      {/* soft shapes give the frosted glass something to blur */}
      <View pointerEvents="none" style={[s.blob, { width: 360, height: 360, top: -90, right: -110, backgroundColor: 'rgba(255,246,224,0.55)' }]} />
      <View pointerEvents="none" style={[s.blob, { width: 280, height: 280, bottom: 40, left: -90, backgroundColor: 'rgba(138,100,20,0.28)' }]} />
      <AuthProvider>
        <Slot />
      </AuthProvider>
    </LinearGradient>
  );
}

const s = StyleSheet.create({ blob: { position: 'absolute', borderRadius: 999 } });
