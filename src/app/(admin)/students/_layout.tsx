import { Stack } from 'expo-router';
import { stackScreenOptions } from '@/lib/tabOptions';

// Murid tab: list -> detail, with the standard back button.
export default function StudentsLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="index" options={{ title: 'Murid' }} />
      <Stack.Screen name="[nis]" options={{ title: 'Detail murid' }} />
    </Stack>
  );
}
