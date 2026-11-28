import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Btn, Field, Panel, Separator } from '@/components/form';
import { Avatar } from '@/components/Bento';
import { Icon } from '@/components/Icon';
import { listStudents, saveStudent, type Student } from '@/lib/admin';
import { gradeOf, normalizeClassName } from '@/lib/grade';
import { useWide } from '@/lib/layout';
import { colors, glass, radius } from '@/theme';

export default function GradeStudents() {
  const router = useRouter();
  const wide = useWide();
  const { grade } = useLocalSearchParams<{ grade: string }>();
  const gradeNum = Number(grade);
  const emptyForm = { nis: '', full_name: '', nickname: '', class_name: Number.isFinite(gradeNum) ? `${gradeNum}-` : '' };

  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Student[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setRows(await listStudents(q)); } catch { setMsg('Gagal memuat data murid.'); }
  }, [q]);
  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    if (!form.nis.trim() || !form.full_name.trim() || !form.class_name.trim()) {
      setMsg('NIS, nama, dan kelas wajib diisi.');
      return;
    }
    try {
      await saveStudent({
        nis: form.nis.trim(),
        full_name: form.full_name.trim(),
        nickname: form.nickname.trim() || null,
        class_name: normalizeClassName(form.class_name),
      });
      setForm(emptyForm);
      setMsg('Murid disimpan.');
      setOpen(false);
      void load();
    } catch {
      setMsg('Gagal menyimpan murid.');
    }
  };

  const shown = rows.filter((r) => gradeOf(r.class_name) === gradeNum);

  const formPanel = (
    <Panel style={wide ? { width: 320 } : undefined}>
      <Field placeholder="NIS" value={form.nis} onChangeText={(v) => setForm({ ...form, nis: v })} />
      <Field placeholder="Nama lengkap" value={form.full_name} onChangeText={(v) => setForm({ ...form, full_name: v })} />
      <Field placeholder="Panggilan (dibaca suara)" value={form.nickname} onChangeText={(v) => setForm({ ...form, nickname: v })} />
      <Field placeholder={`Kelas, mis. ${grade}-A`} value={form.class_name} onChangeText={(v) => setForm({ ...form, class_name: v })} />
      <Btn icon="save-outline" label="Simpan murid" onPress={save} />
    </Panel>
  );

  return (
    <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: `Kelas ${grade}` }} />
      <View style={s.head}>
        <Text style={s.count}>{shown.length} murid kelas {grade}</Text>
        {!wide && <Btn icon={open ? 'close' : 'add'} label={open ? 'Tutup form' : 'Tambah murid'} onPress={() => setOpen(!open)} />}
      </View>
      {msg && <Text style={s.msg}>{msg}</Text>}
      <View style={[s.body, wide && { flexDirection: 'row', alignItems: 'flex-start' }]}>
        {(wide || open) && formPanel}
        <View style={{ flex: 1, gap: 10 }}>
          <Field icon="search-outline" placeholder="Cari nama atau NIS" value={q} onChangeText={setQ} />
          <View style={s.list}>
            {shown.length === 0 ? (
              <Text style={s.empty}>Belum ada murid di kelas {grade}.</Text>
            ) : shown.map((item, i) => (
              <View key={item.nis}>
                {i > 0 && <Separator />}
                <Pressable style={[s.row, !item.is_active && { opacity: 0.5 }]} onPress={() => router.push(`/students/${item.nis}`)}>
                  <Avatar name={item.full_name} seed={item.nis} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.name}>{item.full_name}</Text>
                    <Text style={s.meta}>NIS {item.nis}{item.is_active ? '' : ', nonaktif'}</Text>
                  </View>
                  <Text style={s.cls}>{item.class_name}</Text>
                  <Icon name="chevron-forward" size={20} color={colors.muted} />
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 16, gap: 12, paddingBottom: 32 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  body: { gap: 12 },
  count: { fontSize: 16, fontWeight: '700', color: colors.muted },
  msg: { color: colors.goldDeep, fontSize: 15, fontWeight: '600' },
  list: { ...glass, borderRadius: radius, flexGrow: 0 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  name: { fontSize: 17, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 14, color: colors.muted },
  cls: { fontSize: 18, fontWeight: '800', color: colors.goldDeep },
  empty: { textAlign: 'center', color: colors.muted, padding: 32, fontSize: 16 },
});
