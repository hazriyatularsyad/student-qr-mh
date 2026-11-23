import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '@/lib/auth';

export default function AdminLayout() {
  const { role, loading } = useAuth();
  if (!loading && role !== 'admin') return <Redirect href="/" />;
  return (
    <Tabs>
      <Tabs.Screen name="students" options={{ title: 'Murid' }} />
      <Tabs.Screen name="import" options={{ title: 'Impor' }} />
      <Tabs.Screen name="staff" options={{ title: 'Petugas' }} />
      <Tabs.Screen name="reports" options={{ title: 'Laporan' }} />
      <Tabs.Screen name="student/[nis]" options={{ href: null, title: 'Detail murid' }} />
    </Tabs>
  );
}
