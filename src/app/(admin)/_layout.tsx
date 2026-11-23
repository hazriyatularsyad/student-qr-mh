import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { tabIcon, tabScreenOptions } from '@/lib/tabOptions';

export default function AdminLayout() {
  const { role, loading } = useAuth();
  if (!loading && role !== 'admin') return <Redirect href="/" />;
  return (
    <Tabs screenOptions={tabScreenOptions}>
      <Tabs.Screen name="home" options={{ title: 'Beranda', tabBarIcon: tabIcon('grid') }} />
      <Tabs.Screen name="students" options={{ title: 'Murid', headerShown: false, tabBarIcon: tabIcon('school') }} />
      <Tabs.Screen name="import" options={{ title: 'Impor murid', tabBarLabel: 'Impor', tabBarIcon: tabIcon('cloud-upload') }} />
      <Tabs.Screen name="staff" options={{ title: 'Petugas', tabBarIcon: tabIcon('people') }} />
      <Tabs.Screen name="reports" options={{ title: 'Laporan', tabBarIcon: tabIcon('bar-chart') }} />
    </Tabs>
  );
}
