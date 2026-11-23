import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { tabIcon, tabScreenOptions } from '@/lib/tabOptions';

export default function PetugasLayout() {
  const { role, loading } = useAuth();
  if (!loading && role !== 'petugas') return <Redirect href="/" />;
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="scan" options={{ title: 'Pindai', tabBarIcon: tabIcon('qr-code') }} />
      <Tabs.Screen name="logs" options={{ title: 'Log hari ini', tabBarLabel: 'Log', tabBarIcon: tabIcon('list') }} />
      <Tabs.Screen name="settings" options={{ title: 'Pengaturan suara', tabBarLabel: 'Suara', tabBarIcon: tabIcon('volume-high') }} />
    </Tabs>
  );
}
