import { Pressable, StyleSheet } from 'react-native';
import { Icon } from '@/components/Icon';
import { useAuth } from '@/lib/auth';
import { confirmAction } from '@/lib/confirm';

export function LogoutButton() {
  const { signOut } = useAuth();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Keluar"
      hitSlop={8}
      style={({ pressed }) => [s.btn, pressed && { opacity: 0.6 }]}
      onPress={() => confirmAction('Keluar dari aplikasi?', 'Anda perlu login lagi untuk memindai.', () => void signOut(), 'Keluar')}
    >
      <Icon name="log-out-outline" size={24} color="#FFFFFF" />
    </Pressable>
  );
}

const s = StyleSheet.create({ btn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginRight: 4 } });
