import { View } from 'react-native';
import { Slot } from 'expo-router';
import { AuthProvider } from '@/lib/auth';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AuthProvider>
        <Slot />
      </AuthProvider>
    </View>
  );
}
