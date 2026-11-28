import { Stack } from 'expo-router';
import { stackScreenOptions } from '@/lib/tabOptions';

// Murid tab: list -> kelas -> detail, with the standard back button.
export default function StudentsLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="index" options={{ title: 'Murid' }} />
      <Stack.Screen name="kelas/[grade]" options={{ title: 'Kelas' }} />
      <Stack.Screen name="[nis]" options={{ title: 'Detail murid' }} />
    </Stack>
  );
}
