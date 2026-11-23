import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/Bento';
import { Btn, Field, Panel, Separator } from '@/components/form';
import { createStaff, listStaff, setStaffActive, type StaffRow } from '@/lib/admin';
import { useWide } from '@/lib/layout';
import { colors, glass, radius } from '@/theme';

export default function Staff() {
  const wide = useWide();
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [f, setF] = useState({ email: '', password: '', full_name: '' });
  const [role, setRole] = useState<'petugas' | 'admin'>('petugas');
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => { try { setRows(await listStaff()); } catch { setMsg('Gagal memuat akun.'); } }, []);
  useEffect(() => { void load(); }, [load]);

  const create = async () => {
    if (!f.email.includes('@') || f.password.length < 8 || !f.full_name.trim()) { setMsg('Email valid, kata sandi minimal 8 karakter, dan nama wajib diisi.'); return; }
    try { await createStaff({ ...f, full_name: f.full_name.trim(), role }); setF({ email: '', password: '', full_name: '' }); setMsg('Akun dibuat.'); void load(); }
    catch { setMsg('Gagal membuat akun.'); }
  };

  return (
    <View style={s.wrap}>
      {msg && <Text style={s.msg}>{msg}</Text>}
      <View style={[{ gap: 12 }, wide && { flexDirection: 'row', alignItems: 'flex-start' }]}>
        <Panel style={wide ? { width: 320 } : undefined}>
          <Field placeholder="Nama lengkap" value={f.full_name} onChangeText={(v) => setF({ ...f, full_name: v })} />
          <Field placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={f.email} onChangeText={(v) => setF({ ...f, email: v })} />
          <Field placeholder="Kata sandi, min. 8 karakter" secureTextEntry value={f.password} onChangeText={(v) => setF({ ...f, password: v })} />
          <View style={s.chips}>
            {(['petugas', 'admin'] as const).map((r) => (
              <Pressable key={r} onPress={() => setRole(r)} style={[s.chip, role === r && { backgroundColor: colors.gold }]}>
                <Text style={[s.chipText, role === r && { color: colors.onBright }]}>{r}</Text>
              </Pressable>
            ))}
          </View>
          <Btn icon="person-add-outline" label="Buat akun" onPress={create} />
        </Panel>
        <FlatList
          style={[s.list, { flex: 1 }]}
          data={rows}
          keyExtractor={(r) => r.id}
          ItemSeparatorComponent={Separator}
          renderItem={({ item }) => (
            <View style={s.row}>
              <Avatar name={item.full_name} seed={item.id} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.name}>{item.full_name}</Text>
                <Text style={s.meta}>{item.role}{item.is_active ? '' : ', nonaktif'}</Text>
              </View>
              <Pressable onPress={async () => { await setStaffActive(item.id, !item.is_active); void load(); }}>
                <Text style={s.link}>{item.is_active ? 'Nonaktifkan' : 'Aktifkan'}</Text>
              </Pressable>
            </View>
          )}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 16, gap: 12 },
  msg: { color: colors.goldDeep, fontSize: 15, fontWeight: '600' },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { minHeight: 44, paddingHorizontal: 18, borderRadius: radius, borderWidth: 1, borderColor: colors.line, backgroundColor: 'rgba(255,255,255,0.45)', justifyContent: 'center' },
  chipText: { fontSize: 15, fontWeight: '700', color: colors.ink },
  list: { ...glass, borderRadius: radius, flexGrow: 0 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  name: { fontSize: 17, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 14, color: colors.muted },
  link: { color: colors.goldDeep, fontSize: 15, fontWeight: '800', paddingVertical: 8 },
});
