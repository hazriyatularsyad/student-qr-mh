import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '@/lib/auth';

export default function AdminLayout() {
  const { role, loading } = useAuth();
  if (!loading && role !== 'admin') return <Redirect href="/" />;
  return (
    <Tabs>
      <Tabs.Screen name="students" options={{ title: 'Murid' }} />
    </Tabs>
  );
}
