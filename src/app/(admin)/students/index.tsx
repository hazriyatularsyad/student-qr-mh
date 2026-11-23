import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Btn, Field, Panel, Separator } from '@/components/form';
import { Avatar, BentoGrid, IconBadge, Tile, TileLabel, TileValue } from '@/components/Bento';
import { Icon } from '@/components/Icon';
import { listStudents, saveStudent, type Student } from '@/lib/admin';
import { countByGrade, gradeOf, GRADES, normalizeClassName } from '@/lib/grade';
import { useWide } from '@/lib/layout';
import { colors, glass, radius, type Tone } from '@/theme';

const FOLDER_TONES: Tone[] = ['gold', 'forest', 'coral', 'teal', 'plum', 'indigo'];

const EMPTY = { nis: '', full_name: '', nickname: '', class_name: '' };

export default function Students() {
  const router = useRouter();
  const wide = useWide();
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Student[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [open, setOpen] = useState(false);
  const [grade, setGrade] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setRows(await listStudents(q)); } catch { setMsg('Gagal memuat data murid.'); }
  }, [q]);
  useEffect(() => { void load(); }, [load]);

  const save = async () => {
    if (!form.nis.trim() || !form.full_name.trim() || !form.class_name.trim()) { setMsg('NIS, nama, dan kelas wajib diisi.'); return; }
    try {
      await saveStudent({ nis: form.nis.trim(), full_name: form.full_name.trim(), nickname: form.nickname.trim() || null, class_name: normalizeClassName(form.class_name) });
      setForm(EMPTY); setMsg('Murid disimpan.'); setOpen(false); void load();
    } catch { setMsg('Gagal menyimpan murid.'); }
  };

  const counts = countByGrade(rows);
  const shown = grade === null ? rows : rows.filter((r) => gradeOf(r.class_name) === grade);

  const formPanel = (
    <Panel style={wide ? { width: 320 } : undefined}>
      <Field placeholder="NIS" value={form.nis} onChangeText={(v) => setForm({ ...form, nis: v })} />
      <Field placeholder="Nama lengkap" value={form.full_name} onChangeText={(v) => setForm({ ...form, full_name: v })} />
      <Field placeholder="Panggilan (dibaca suara)" value={form.nickname} onChangeText={(v) => setForm({ ...form, nickname: v })} />
      <Field placeholder="Kelas, mis. 3-A" value={form.class_name} onChangeText={(v) => setForm({ ...form, class_name: v })} />
      <Btn icon="save-outline" label="Simpan murid" onPress={save} />
    </Panel>
  );

  return (
    <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
      <View style={s.head}>
        <Text style={s.count}>{grade === null ? `${rows.length} murid` : `${shown.length} murid kelas ${grade}`}</Text>
        {!wide && <Btn icon={open ? 'close' : 'add'} label={open ? 'Tutup form' : 'Tambah murid'} onPress={() => setOpen(!open)} />}
      </View>
      {msg && <Text style={s.msg}>{msg}</Text>}
      <BentoGrid>
        {GRADES.map((g, i) => {
          const on = grade === g;
          const tone = FOLDER_TONES[i];
          return (
            <Tile key={g} tone={tone} shape="folder" selected={on}
              label={`Kelas ${g}, ${counts[g]} murid`}
              onPress={() => setGrade(on ? null : g)}
              style={{ minHeight: 118, justifyContent: 'space-between', opacity: grade === null || on ? 1 : 0.4 }}>
              <IconBadge name={on ? 'checkmark' : 'folder-open'} size={36} />
              <View>
                <TileValue tone={tone} size={26}>Kelas {g}</TileValue>
                <TileLabel tone={tone}>{counts[g]} murid</TileLabel>
              </View>
            </Tile>
          );
        })}
      </BentoGrid>
      <View style={[s.body, wide && { flexDirection: 'row', alignItems: 'flex-start' }]}>
        {(wide || open) && formPanel}
        <View style={{ flex: 1, gap: 10 }}>
          <Field icon="search-outline" placeholder="Cari nama atau NIS" value={q} onChangeText={setQ} />
          <View style={s.list}>
            {shown.length === 0 ? (
              <Text style={s.empty}>{grade !== null ? `Belum ada murid di kelas ${grade}.` : 'Belum ada murid. Tambahkan satu, atau impor dari CSV.'}</Text>
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
