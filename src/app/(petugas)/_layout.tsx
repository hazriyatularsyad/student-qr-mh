import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '@/lib/auth';

export default function PetugasLayout() {
  const { role, loading } = useAuth();
  if (!loading && role !== 'petugas') return <Redirect href="/" />;
  return (
    <Tabs>
      <Tabs.Screen name="scan" options={{ title: 'Pindai' }} />
      <Tabs.Screen name="logs" options={{ title: 'Log hari ini' }} />
      <Tabs.Screen name="settings" options={{ title: 'Pengaturan' }} />
    </Tabs>
  );
}
