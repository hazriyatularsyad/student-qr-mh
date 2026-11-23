# **Product Requirement Document (PRD): Sistem Penjemputan Murid Berbasis QR Code**

Dokumen Spesifikasi Kebutuhan Produk (PRD) Sistem Operasional Sekolah Berbasis Mobile & Cloud Server.

---

# **1\. Ringkasan Eksekutif & Tujuan Produk**

* **Nama Produk**: Sistem Penjemputan Murid QR (School Pickup QR Scanner)  
* **Platform**: Aplikasi Mobile Android & iOS menggunakan [React Native](https://reactnative.dev/docs/getting-started)  
* **Database & Backend**: Basis data relasional PostgreSQL menggunakan [Supabase](https://supabase.com/docs) ([Panduan Supabase \+ Expo React Native](https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native))  
* **Tujuan Utama**: Meningkatkan keamanan serah terima murid dengan memverifikasi wali murid yang berwenang melalui pemindaian QR code oleh petugas sekolah menggunakan smartphone, mempercepat antrean penjemputan melalui pengumuman suara otomatis berbasis Text-to-Speech (contoh: *"Aksa sudah dijemput."*), serta menyediakan jejak audit penjemputan yang akurat.  
* **Alasan Pemilihan Database Relasional (Supabase)**: Menjamin integritas referensial antar data murid, wali murid (relasi ketat 1-ke-1 berbasis NIS), dan log penjemputan melalui constraint `PRIMARY KEY`, `FOREIGN KEY`, `UNIQUE`, transaksi atomik (RPC), Row Level Security (RLS), serta sinkronisasi real-time.

---

# **2\. Pengguna & Peran (User Roles)**

| Peran Pengguna | Deskripsi Akses & Tanggung Jawab | Antarmuka Pengguna |
| :---- | :---- | :---- |
| **Petugas Sekolah (Scanner)** | Menggunakan aplikasi mobile React Native di HP untuk memindai QR code wali murid, memverifikasi identitas penjemput, memicu pengumuman TTS, dan melihat log harian. | Aplikasi Mobile (React Native) |
| **Admin Sekolah** | Mengelola data master murid (NIS, nama, kelas), mendaftarkan 1 wali murid per NIS, menerbitkan/mencabut QR code terenkripsi, dan meninjau laporan audit penjemputan. | Panel Admin Web / Supabase Studio |
| **Wali Murid** | Pemegang kartu/gambar QR code resmi milik murid (1 wali per 1 murid berdasarkan NIS) yang ditunjukkan kepada petugas saat penjemputan. | Kartu Fisik / Aplikasi Wali |

---

# **3\. Ruang Lingkup Fitur (Functional Requirements)**

## **3.1 Autentikasi Petugas**

* Login petugas menggunakan email & kata sandi via [Supabase Auth untuk React Native](https://supabase.com/docs/guides/auth/quickstarts/react-native).  
* Token sesi disimpan secara terenkripsi menggunakan [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/) sesuai panduan [keamanan React Native](https://reactnative.dev/docs/security).

## **3.2 Pemindaian QR Code & Verifikasi Real-Time**

* Pemindaian real-time melalui kamera HP petugas menggunakan [react-native-vision-camera](https://visioncamera.margelo.com/docs) dan modul [Barcode Scanner](https://visioncamera.margelo.com/docs/barcode-scanner).  
* Format QR Code: Payload string terenkripsi/bertanda tangan (`qr_token_hash`) yang dipetakan ke 1 wali dan 1 NIS (bukan NIS polos) untuk mencegah pemalsuan.  
* Alur verifikasi atomik melalui PostgreSQL RPC `verify_and_log_pickup`:  
  1. Validasi token QR aktif di tabel `guardians` dan status murid aktif di `students`.  
  2. Cek apakah murid sudah dijemput pada tanggal hari ini (`pickup_date = CURRENT_DATE` dan `status = 'verified'`).  
  3. Jika valid dan belum dijemput: masukkan baris baru ke `pickup_logs` dengan status `verified`, lalu kembalikan data siswa (`nis`, `full_name`, `nickname`, `class_name`, `photo_url`) dan data wali (`full_name`, `relationship`).  
  4. Jika sudah dijemput hari ini: kembalikan status `duplicate` beserta waktu penjemputan sebelumnya dan nama petugas pemindai.  
  5. Jika QR tidak ditemukan/nonaktif: kembalikan status `rejected` dan tampilkan peringatan merah.  
* Mekanisme debounce/cooldown 4 detik di aplikasi agar satu QR yang masih di depan kamera tidak memicu request berulang.

## **3.3 Pengumuman Suara Otomatis (Text-to-Speech)**

* Menggunakan [expo-speech](https://docs.expo.dev/versions/latest/sdk/speech/) (atau alternatif bare React Native [@mhpdev/react-native-speech](https://www.npmjs.com/package/@mhpdev/react-native-speech)).  
* Bahasa default: `id-ID` (Bahasa Indonesia), dengan kecepatan (`rate: 0.95`) dan nada (`pitch: 1.0`) yang dapat diatur petugas.  
* Template pengumuman default: `"{nickname_atau_nama} sudah dijemput."` (contoh: *"Aksa sudah dijemput."*).  
* Antrean suara (FIFO Queue): Jika petugas memindai beberapa QR berturut-turut, pengumuman masuk antrean agar tidak saling memotong.  
* Mendukung output ke speaker HP maupun speaker Bluetooth eksternal di gerbang sekolah, dilengkapi tombol "Ulangi Suara" dan "Tes Speaker".

## **3.4 Log Penjemputan & Audit Keamanan**

* Daftar riwayat penjemputan hari ini (real-time) dengan filter berdasarkan kelas, status (`verified`, `duplicate`, `rejected`), dan pencarian nama/NIS.  
* Detail log menampilkan: NIS, Nama Murid, Kelas, Nama Wali & Hubungan, Petugas Pemindai, dan stempel waktu (`scanned_at`).

## **3.5 Manajemen QR Code (Opsional di Aplikasi / Panel Admin)**

* Pembuatan visual QR code dari string terenkripsi menggunakan [react-native-qrcode-svg](https://www.npmjs.com/package/react-native-qrcode-svg) untuk dicetak atau dibagikan ke wali murid.

---

# **4\. Arsitektur Data, Skema Database Relasional & Tipe Data (Supabase PostgreSQL)**

## **4.1 Pemetaan Relasi Data**

* `students` (1) \$\\leftrightarrow\$ (1) `guardians` melalui `guardians.student_nis` (`UNIQUE`, `FOREIGN KEY` ke `students.nis`).  
* `students` (1) \$\\leftrightarrow\$ (N) `pickup_logs` melalui `pickup_logs.student_nis`.  
* `guardians` (1) \$\\leftrightarrow\$ (N) `pickup_logs` melalui `pickup_logs.guardian_id`.  
* `staff` (1) \$\\leftrightarrow\$ (N) `pickup_logs` melalui `pickup_logs.scanner_id`.

## **4.2 Spesifikasi Tipe Data Kolom**

### **Tabel `staff`**

| Nama Kolom | Tipe PostgreSQL | Tipe TypeScript | Constraint | Deskripsi |
| :---- | :---- | :---- | :---- | :---- |
| `id` | `uuid` | `string` | PK, FK `auth.users(id)` | ID unik staf terhubung Supabase Auth |
| `full_name` | `varchar(120)` | `string` | NOT NULL | Nama lengkap petugas |
| `role` | `varchar(20)` | `'petugas' | 'admin'` | CHECK IN (`'petugas'`,`'admin'`) | Peran pengguna dalam sistem |
| `is_active` | `boolean` | `boolean` | DEFAULT `true` | Status keaktifan akun petugas |
| `created_at` | `timestamptz` | `string` | DEFAULT `now()` | Waktu pendaftaran akun |

### **Tabel `students`**

| Nama Kolom | Tipe PostgreSQL | Tipe TypeScript | Constraint | Deskripsi |
| :---- | :---- | :---- | :---- | :---- |
| `nis` | `varchar(32)` | `string` | PK | Nomor Induk Siswa (unik) |
| `full_name` | `varchar(120)` | `string` | NOT NULL | Nama lengkap siswa |
| `nickname` | `varchar(60)` | `string | null` | NULLABLE | Nama panggilan untuk audio TTS |
| `class_name` | `varchar(30)` | `string` | NOT NULL | Tingkat/Nama Kelas (contoh: 1-A) |
| `photo_url` | `text` | `string | null` | NULLABLE | URL foto siswa di Supabase Storage |
| `is_active` | `boolean` | `boolean` | DEFAULT true | Status keaktifan murid |
| `created_at` | `timestamptz` | `string` | DEFAULT now() | Stempel waktu pembuatan |
| `updated_at` | `timestamptz` | `string` | DEFAULT now() | Stempel waktu perbaruan |

### **Tabel `guardians`**

| Nama Kolom | Tipe PostgreSQL | Tipe TypeScript | Constraint | Deskripsi |
| :---- | :---- | :---- | :---- | :---- |
| `id` | `uuid` | `string` | PK, DEFAULT gen\_random\_uuid() | ID unik wali murid |
| `student_nis` | `varchar(32)` | `string` | UNIQUE NOT NULL, FK students(nis) | Relasi 1-to-1 ketat ke tabel siswa |
| `full_name` | `varchar(120)` | `string` | NOT NULL | Nama lengkap wali murid |
| `relationship` | `varchar(40)` | `string` | NOT NULL | Hubungan (Ayah, Ibu, Paman, dll) |
| `phone_number` | `varchar(25)` | `string` | NOT NULL | Nomor kontak wali |
| `qr_token_hash` | `varchar(128)` | `string` | UNIQUE NOT NULL | Hash token terenkripsi dari QR |
| `qr_issued_at` | `timestamptz` | `string` | DEFAULT now() | Waktu penerbitan QR Code |
| `is_active` | `boolean` | `boolean` | DEFAULT true | Status berlaku kartu QR |
| `created_at` | `timestamptz` | `string` | DEFAULT now() | Stempel waktu pembuatan |
| `updated_at` | `timestamptz` | `string` | DEFAULT now() | Stempel waktu perbaruan |

### **Tabel `pickup_logs`**

| Nama Kolom | Tipe PostgreSQL | Tipe TypeScript | Constraint | Deskripsi |
| :---- | :---- | :---- | :---- | :---- |
| `id` | `uuid` | `string` | PK, DEFAULT gen\_random\_uuid() | ID unik entri log penjemputan |
| `student_nis` | `varchar(32)` | `string` | NOT NULL, FK students(nis) | NIS siswa yang dijemput |
| `guardian_id` | `uuid` | `string` | NOT NULL, FK guardians(id) | ID wali yang melakukan scan |
| `scanner_id` | `uuid` | `string` | NOT NULL, FK staff(id) | ID petugas yang memindai |
| `pickup_date` | `date` | `string` | NOT NULL, DEFAULT CURRENT\_DATE | Tanggal kalender penjemputan |
| `scanned_at` | `timestamptz` | `string` | NOT NULL, DEFAULT now() | Presisi waktu scan dilakukan |
| `status` | `varchar(20)` | `'verified' | 'duplicate' | 'rejected'` | CHECK IN ('verified', 'duplicate', 'rejected') | Hasil status verifikasi scan |
| `notes` | `text` | `string | null` | NULLABLE | Catatan opsional dari petugas |
| `device_info` | `jsonb` | `Record<string, any> | null` | NULLABLE | Meta data HP petugas pemindai |

**Catatan Index Penting**:  
Diterapkan Partial Unique Index `uniq_verified_pickup_per_day ON pickup_logs (student_nis, pickup_date) WHERE status = 'verified'` untuk menjamin di tingkat database bahwa 1 murid hanya tercatat status verified satu kali per hari.

## **4.3 DDL SQL PostgreSQL & Fungsi RPC**

l  
\-- 1\. SETUP TABEL DATA MASTER DAN LOG

CREATE TABLE public.staff (  
id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,  
full\_name VARCHAR(120) NOT NULL,  
role VARCHAR(20) NOT NULL CHECK (role IN ('petugas', 'admin')),  
is\_active BOOLEAN NOT NULL DEFAULT true,  
created\_at TIMESTAMPTZ NOT NULL DEFAULT now()  
);

CREATE TABLE public.students (  
nis VARCHAR(32) PRIMARY KEY,  
full\_name VARCHAR(120) NOT NULL,  
nickname VARCHAR(60),  
class\_name VARCHAR(30) NOT NULL,  
photo\_url TEXT,  
is\_active BOOLEAN NOT NULL DEFAULT true,  
created\_at TIMESTAMPTZ NOT NULL DEFAULT now(),  
updated\_at TIMESTAMPTZ NOT NULL DEFAULT now()  
);

CREATE TABLE public.guardians (  
id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
student\_nis VARCHAR(32) UNIQUE NOT NULL REFERENCES public.students(nis) ON DELETE CASCADE,  
full\_name VARCHAR(120) NOT NULL,  
relationship VARCHAR(40) NOT NULL,  
phone\_number VARCHAR(25) NOT NULL,  
qr\_token\_hash VARCHAR(128) UNIQUE NOT NULL,  
qr\_issued\_at TIMESTAMPTZ NOT NULL DEFAULT now(),  
is\_active BOOLEAN NOT NULL DEFAULT true,  
created\_at TIMESTAMPTZ NOT NULL DEFAULT now(),  
updated\_at TIMESTAMPTZ NOT NULL DEFAULT now()  
);

CREATE TABLE public.pickup\_logs (  
id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),  
student\_nis VARCHAR(32) NOT NULL REFERENCES public.students(nis),  
guardian\_id UUID NOT NULL REFERENCES public.guardians(id),  
scanner\_id UUID NOT NULL REFERENCES public.staff(id),  
pickup\_date DATE NOT NULL DEFAULT CURRENT\_DATE,  
scanned\_at TIMESTAMPTZ NOT NULL DEFAULT now(),  
status VARCHAR(20) NOT NULL CHECK (status IN ('verified', 'duplicate', 'rejected')),  
notes TEXT,  
device\_info JSONB  
);

\-- Index Penting untuk Akses Cepat dan Proteksi Duplikasi  
CREATE UNIQUE INDEX uniq\_verified\_pickup\_per\_day  
ON public.pickup\_logs (student\_nis, pickup\_date)  
WHERE status \= 'verified';

CREATE INDEX idx\_pickup\_logs\_date\_class  
ON public.pickup\_logs (pickup\_date, status);

\-- 2\. ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.pickup\_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Petugas terautentikasi dapat membaca data siswa"  
ON public.students FOR SELECT TO authenticated USING (is\_active \= true);

CREATE POLICY "Petugas terautentikasi dapat membaca data wali"  
ON public.guardians FOR SELECT TO authenticated USING (is\_active \= true);

CREATE POLICY "Petugas terautentikasi dapat membaca log penjemputan"  
ON public.pickup\_logs FOR SELECT TO authenticated USING (true);

\-- 3\. PROSEDUR ATOMIK RPC VERIFIKASI PENJEMPUTAN

CREATE OR REPLACE FUNCTION public.verify\_and\_log\_pickup(  
p\_qr\_token\_hash VARCHAR(128),  
p\_scanner\_id UUID,  
p\_device\_info JSONB DEFAULT NULL  
)  
RETURNS JSONB  
LANGUAGE plpgsql  
SECURITY DEFINER  
AS \$\$  
DECLARE  
v\_guardian RECORD;  
v\_student RECORD;  
v\_existing\_log RECORD;  
v\_scanner\_name VARCHAR(120);  
v\_new\_log\_id UUID;  
BEGIN  
\-- Validasi Keaktifan Petugas Pemindai  
SELECT full\_name INTO v\_scanner\_name FROM public.staff WHERE id \= p\_scanner\_id AND is\_active \= true;  
IF NOT FOUND THEN  
RETURN jsonb\_build\_object('status', 'rejected', 'message', 'Petugas tidak terdaftar atau tidak aktif.');  
END IF;

```
-- Carikan Data Wali berdasarkan Token Hash QR
SELECT * INTO v_guardian FROM public.guardians WHERE qr_token_hash = p_qr_token_hash AND is_active = true;
IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'rejected', 'message', 'QR Code tidak valid atau telah dicabut.');
END IF;

-- Carikan Data Siswa Terkait
SELECT * INTO v_student FROM public.students WHERE nis = v_guardian.student_nis AND is_active = true;
IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'rejected', 'message', 'Data murid tidak ditemukan atau nonaktif.');
END IF;

-- Cek Penjemputan Duplikat Hari Ini
SELECT pl.*, st.full_name AS scanner_name 
INTO v_existing_log 
FROM public.pickup_logs pl
JOIN public.staff st ON st.id = pl.scanner_id
WHERE pl.student_nis = v_student.nis 
  AND pl.pickup_date = CURRENT_DATE 
  AND pl.status = 'verified';

IF FOUND THEN
    -- Catat Percobaan Scan Duplikat
    INSERT INTO public.pickup_logs (student_nis, guardian_id, scanner_id, status, notes, device_info)
    VALUES (v_student.nis, v_guardian.id, p_scanner_id, 'duplicate', 'Percobaan pemindaian ulang', p_device_info);

    RETURN jsonb_build_object(
        'status', 'duplicate',
        'message', 'Murid ini sudah dijemput sebelumnya hari ini.',
        'previous_scanned_at', v_existing_log.scanned_at,
        'previous_scanner_name', v_existing_log.scanner_name,
        'student', jsonb_build_object(
            'nis', v_student.nis,
            'full_name', v_student.full_name,
            'nickname', COALESCE(v_student.nickname, v_student.full_name),
            'class_name', v_student.class_name
        )
    );
END IF;

-- Simpan Penjemputan Sah (Verified)
INSERT INTO public.pickup_logs (student_nis, guardian_id, scanner_id, status, device_info)
VALUES (v_student.nis, v_guardian.id, p_scanner_id, 'verified', p_device_info)
RETURNING id INTO v_new_log_id;

RETURN jsonb_build_object(
    'status', 'verified',
    'message', 'Verifikasi berhasil.',
    'log_id', v_new_log_id,
    'scanned_at', now(),
    'student', jsonb_build_object(
        'nis', v_student.nis,
        'full_name', v_student.full_name,
        'nickname', COALESCE(v_student.nickname, v_student.full_name),
        'class_name', v_student.class_name,
        'photo_url', v_student.photo_url
    ),
    'guardian', jsonb_build_object(
        'full_name', v_guardian.full_name,
        'relationship', v_guardian.relationship
    )
);
```

END;  
\$\$