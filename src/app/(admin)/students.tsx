import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Btn, Field } from '@/components/form';
import { listStudents, saveStudent, type Student } from '@/lib/admin';
import { colors, radius } from '@/theme';

export default function Students() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Student[]>([]);
  const [form, setForm] = useState({ nis: '', full_name: '', nickname: '', class_name: '' });
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setRows(await listStudents(q)); } catch { setMsg('Gagal memuat data murid.'); }
  }, [q]);
  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    if (!form.nis.trim() || !form.full_name.trim() || !form.class_name.trim()) { setMsg('NIS, nama, dan kelas wajib diisi.'); return; }
    try {
      await saveStudent({ nis: form.nis.trim(), full_name: form.full_name.trim(), nickname: form.nickname.trim() || null, class_name: form.class_name.trim() });
      setForm({ nis: '', full_name: '', nickname: '', class_name: '' });
      setMsg('Murid disimpan.');
      void load();
    } catch { setMsg('Gagal menyimpan murid.'); }
  };

  return (
    <View style={s.wrap}>
      <Field placeholder="Cari nama atau NIS" value={q} onChangeText={setQ} />
      <View style={s.form}>
        <Field placeholder="NIS" value={form.nis} onChangeText={(v) => setForm({ ...form, nis: v })} />
        <Field placeholder="Nama lengkap" value={form.full_name} onChangeText={(v) => setForm({ ...form, full_name: v })} />
        <Field placeholder="Panggilan (untuk suara)" value={form.nickname} onChangeText={(v) => setForm({ ...form, nickname: v })} />
        <Field placeholder="Kelas (mis. 3-A)" value={form.class_name} onChangeText={(v) => setForm({ ...form, class_name: v })} />
        <Btn label="Simpan murid" onPress={save} />
      </View>
      {msg && <Text style={s.msg}>{msg}</Text>}
      <FlatList data={rows} keyExtractor={(r) => r.nis}
        renderItem={({ item }) => (
          <Pressable style={[s.row, !item.is_active && { opacity: 0.5 }]} onPress={() => router.push(`/student/${item.nis}`)}>
            <Text style={s.name}>{item.full_name}</Text>
            <Text style={s.meta}>NIS {item.nis} · Kelas {item.class_name}{item.is_active ? '' : ' · nonaktif'}</Text>
          </Pressable>
        )} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 16, gap: 10, backgroundColor: colors.bg },
  form: { gap: 8 },
  msg: { color: colors.accent, fontSize: 15 },
  row: { backgroundColor: colors.surface, borderRadius: radius, padding: 14, marginBottom: 8 },
  name: { fontSize: 17, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 14, color: colors.muted },
});
