import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Slot } from 'expo-router';
import { AuthProvider } from '@/lib/auth';
import { gradient } from '@/theme';

export default function RootLayout() {
  return (
    <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill}>
      {/* one soft highlight so the glass has light to refract */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,246,224,0.55)', 'rgba(255,246,224,0)']}
        start={{ x: 0.1, y: 0 }} end={{ x: 0.7, y: 0.6 }}
        style={StyleSheet.absoluteFill}
      />
      <AuthProvider>
        <Slot />
      </AuthProvider>
    </LinearGradient>
  );
}
