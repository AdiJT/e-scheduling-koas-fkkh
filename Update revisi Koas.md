# Panduan Penggunaan Update Sistem E-Scheduling Koas FKKH (Poin 1 - 11)

Dokumen ini berisi penjelasan detail mengenai pembaruan sistem yang telah diimplementasikan dari **Poin 1 hingga Poin 11**. Panduan ini ditujukan agar Client/Pengguna memahami apa yang berubah, fitur baru apa saja yang ditambahkan, di mana letak menunya, serta cara menggunakan setiap fitur tersebut secara praktis.

---

## Daftar Isi
1. [Poin 1: Pembatasan Sub-Stase Khusus Stase KODIL](#poin-1-pembatasan-sub-stase-khusus-stase-kodil)
2. [Poin 2 & Poin 7: Pemindahan Relasi Dosen Pembimbing ke Stase/Jadwal](#poin-2--poin-7-pemindahan-relasi-dosen-pembimbing-ke-stasejadwal)
3. [Poin 3: Perubahan Otomatis Dosen Pembimbing Berdasarkan Stase Aktif](#poin-3-perubahan-otomatis-dosen-pembimbing-berdasarkan-stase-aktif)
4. [Poin 4: Multi-Dosen Pembimbing Per Stase & Sub-Stase](#poin-4-multi-dosen-pembimbing-per-stase--sub-stase)
5. [Poin 5: Manajemen Periode Tahun Ajaran (Ganjil & Genap)](#poin-5-manajemen-periode-tahun-ajaran-ganjil--genap)
6. [Poin 6: Fleksibilitas Dosen di Beberapa Stase & Peringatan Jadwal Bentrok](#poin-6-fleksibilitas-dosen-di-beberapa-stase--peringatan-jadwal-bentrok)
7. [Poin 8: Penunjukan Koordinator Dosen Per Stase](#poin-8-penunjukan-koordinator-dosen-per-stase)
8. [Poin 9 & Poin 10: Histori/Riwayat Kelompok Otomatis (Auto-Archive) & Update Dosen Terakhir](#poin-9--poin-10-histoririwayat-kelompok-otomatis-auto-archive--update-dosen-terakhir)
9. [Poin 11: Edit Username & Password Mandiri via Profil Sidebar](#poin-11-edit-username--password-mandiri-via-profil-sidebar)

---

### Poin 1: Pembatasan Sub-Stase Khusus Stase KODIL
> [!NOTE]
> **Deskripsi Perubahan**: Struktur sub-stase (rotasi kecil) sekarang hanya dimiliki secara eksklusif oleh stase berjenis **KODIL (Koas Pendidikan Dokter Hewan / Klinik)**. Stase non-KODIL (seperti stase mandiri/umum) tidak akan memunculkan menu input sub-stase untuk menyederhanakan data.

* **Letak Menu**: 
  * Login sebagai **Admin/Pengelola** > Pilih menu **Stase** > Klik **Tambah Stase** atau pilih salah satu stase KODIL > Klik **Detail**.
* **Cara Menggunakan**:
  1. Saat menambah stase baru, pilih jenis stase **KODIL** pada dropdown **Jenis Stase**.
  2. Klik **Simpan**. Di halaman detail stase tersebut, tombol **"Tambah Sub-Stase"** akan aktif dan muncul.
  3. Jika jenis stase yang dipilih bukan KODIL, menu input sub-stase tidak akan ditampilkan.

---

### Poin 2 & Poin 7: Pemindahan Relasi Dosen Pembimbing ke Stase/Jadwal
> [!IMPORTANT]
> **Deskripsi Perubahan**: Dosen Pembimbing tidak lagi diikat langsung pada Kelompok Mahasiswa secara permanen. Kini, dosen pembimbing dihubungkan langsung ke **Stase atau Jadwal Stase** tertentu. Ini memungkinkan satu kelompok memiliki dosen pembimbing yang berbeda-beda saat mereka berpindah dari satu stase ke stase berikutnya.

* **Letak Menu**: 
  * Login sebagai **Admin/Pengelola** > Pilih menu **Jadwal** > Klik **Tambah Jadwal** atau klik ikon **Edit** pada jadwal aktif.
* **Cara Menggunakan**:
  1. Saat membuat atau mengedit jadwal stase kelompok, Anda akan melihat pilihan dropdown **Dosen Pembimbing**.
  2. Pilih Dosen Pembimbing yang bertanggung jawab untuk stase tersebut pada kelompok bersangkutan.
  3. Dengan skema ini, kelompok mahasiswa yang sama akan berganti pembimbing secara otomatis di database mengikuti stase yang sedang mereka jalani.

---

### Poin 3: Perubahan Otomatis Dosen Pembimbing Berdasarkan Stase Aktif
> [!TIP]
> **Deskripsi Perubahan**: Halaman Dashboard dan lembar informasi mahasiswa akan menampilkan Dosen Pembimbing yang sedang aktif mendampingi kelompok berdasarkan tanggal hari ini.

* **Letak Menu**:
  * Dapat dilihat langsung pada **Dashboard** (oleh Admin, Dosen, maupun Mahasiswa) serta di menu **Kelompok > Detail Kelompok**.
* **Cara Menggunakan**:
  1. Pengguna hanya perlu membuka halaman **Dashboard**.
  2. Sistem secara otomatis membandingkan tanggal hari ini dengan periode jadwal stase kelompok.
  3. Dosen Pembimbing yang mendampingi kelompok saat ini akan otomatis ditampilkan di layar utama sebagai *"Pembimbing Aktif"*. Jika kelompok berpindah ke stase berikutnya pada tanggal yang baru, tampilan dosen pembimbing di dashboard akan berubah otomatis.

---

### Poin 4: Multi-Dosen Pembimbing Per Stase & Sub-Stase
> [!NOTE]
> **Deskripsi Perubahan**: Satu stase utama maupun sub-stase KODIL kini dapat memiliki lebih dari satu dosen pembimbing yang terdaftar. Saat melakukan penjadwalan kelompok, Admin dapat memilih salah satu dari daftar dosen yang terdaftar di stase tersebut.

* **Letak Menu**: 
  * Login sebagai **Admin/Pengelola** > Pilih menu **Stase** > Pilih stase > Klik **Detail** > Bagian **Daftar Dosen Pembimbing**.
* **Cara Menggunakan**:
  1. Di detail stase, klik tombol **"Pilih Dosen Pembimbing"**. Anda dapat memberi tanda centang pada beberapa dosen sekaligus, lalu klik **Simpan**.
  2. Untuk sub-stase KODIL, gulir ke bawah ke daftar sub-stase, klik **"Atur Dosen"** di samping nama sub-stase untuk mendaftarkan dosen-dosen spesialis sub-stase tersebut.
  3. Saat membuat/mengedit jadwal di menu **Jadwal**, dropdown pilihan dosen pembimbing akan secara otomatis difilter hanya menampilkan dosen-dosen yang telah didaftarkan pada stase/sub-stase tersebut.

---

### Poin 5: Manajemen Periode Tahun Ajaran (Ganjil & Genap)
> [!IMPORTANT]
> **Deskripsi Perubahan**: Ditambahkan manajemen Tahun Ajaran yang mendukung pembagian Semester **Ganjil** dan **Genap**. Setiap mahasiswa kini wajib dihubungkan ke periode tahun ajaran aktif ini.

* **Letak Menu**: 
  * Login sebagai **Admin/Pengelola** > Pilih menu **Tahun Ajaran**.
* **Cara Menggunakan**:
  1. Klik tombol **"Tambah Tahun Ajaran"**.
  2. Input Tahun (misalnya: `2026/2027`) dan pilih tipe Semester (**Ganjil** atau **Genap**) melalui tombol radio.
  3. Tentukan status tahun ajaran tersebut (**Aktif** atau **Tidak Aktif**). Hanya boleh ada satu tahun ajaran yang aktif dalam satu waktu.
  4. Ketika menambah/mengimport mahasiswa baru di menu **Mahasiswa**, Anda wajib memilih Tahun Ajaran aktif ini sebagai periode akademik mereka.

---

### Poin 6: Fleksibilitas Dosen di Beberapa Stase & Peringatan Jadwal Bentrok
> [!WARNING]
> **Deskripsi Perubahan**: Satu dosen kini bisa mengajar di beberapa stase yang berbeda. Namun, apabila dosen tersebut dijadwalkan mengajar di dua stase atau kelompok berbeda dalam rentang waktu yang sama (bentrok), sistem akan menampilkan **Peringatan Peringatan (Warning Alert)**. Admin tetap dapat memaksakan jadwal tersebut jika diperlukan (fleksibel).

* **Letak Menu**: 
  * Muncul secara otomatis saat proses pembuatan jadwal di menu **Jadwal > Tambah Jadwal** atau saat mengedit jadwal di modal edit.
* **Cara Menggunakan**:
  1. Saat mengisi formulir jadwal dan memilih dosen pembimbing yang ternyata sudah memiliki jadwal di kelompok lain pada tanggal tersebut, sistem akan memunculkan kotak peringatan berwarna kuning di bagian bawah formulir.
  2. **Kotak Peringatan** akan berbunyi: *"Dosen [Nama Dosen] sudah membimbing kelompok lain pada rentang tanggal ini."*
  3. Jika Admin mengizinkan bentrok tersebut, centang kotak konfirmasi: *"Saya memahami pelanggaran rule di atas dan tetap ingin menyimpan"* lalu klik **Simpan**. Jika tidak, Admin dapat mengganti dosen pembimbing lain untuk menghindari bentrokan.

---

### Poin 8: Penunjukan Koordinator Dosen Per Stase
> [!TIP]
> **Deskripsi Perubahan**: Untuk setiap stase, Admin dapat menunjuk salah satu dosen pembimbing yang sudah terdaftar di stase tersebut sebagai **Koordinator Stase**.

* **Letak Menu**: 
  * Login sebagai **Admin/Pengelola** > Pilih menu **Stase** > Pilih salah satu stase > Klik **Detail**.
* **Cara Menggunakan**:
  1. Pastikan Anda sudah mendaftarkan beberapa dosen di stase tersebut (pada bagian Daftar Dosen Pembimbing).
  2. Pada dropdown **Koordinator Stase** di halaman detail stase, pilih salah satu nama dosen yang ingin ditunjuk menjadi koordinator.
  3. Klik **Simpan**. Dosen terpilih akan ditandai dengan badge khusus **"Koordinator"** berwarna hijau di tabel daftar stase dan detail stase.

---

### Poin 9 & Poin 10: Histori/Riwayat Kelompok Otomatis (Auto-Archive) & Update Dosen Terakhir
> [!IMPORTANT]
> **Deskripsi Perubahan**: Riwayat stase kelompok yang telah selesai kini diarsipkan **secara otomatis oleh sistem** tanpa perlu tombol arsip manual. Sistem menyimpan snapshot statis berupa data Kelompok, Tahun Ajaran, Stase, Dosen Pembimbing terakhir, dan Anggota Mahasiswa. Jika di kemudian hari Admin mengedit/merevisi dosen pembimbing pada stase yang telah lewat, data di Riwayat akan otomatis terupdate agar tetap sinkron.

* **Letak Menu**: 
  * Dapat diakses oleh semua role di menu **Penjadwalan > Riwayat Kelompok** pada Sidebar.
* **Cara Menggunakan**:
  1. **Proses Pengarsipan Otomatis**: Setiap kali pengguna membuka dashboard atau memuat data kelompok, sistem secara otomatis mengecek apakah ada jadwal stase kelompok yang tanggal selesainya sudah terlewati (`Tanggal Selesai < Hari Ini`). Jika ada, data stase tersebut langsung didokumentasikan ke dalam tabel Riwayat secara otomatis.
  2. **Melihat Riwayat**: Buka menu **Riwayat Kelompok** untuk melihat tabel laporan stase yang telah selesai. Gunakan kotak pencarian untuk memfilter berdasarkan nama kelompok, dosen, stase, atau tahun ajaran.
  3. **Melihat Detail**: Klik ikon **Detail (Mata berwarna biru)** di baris riwayat. Sebuah modal detail akan memuat daftar mahasiswa (NIM & nama), dosen pembimbing stase utama, dan pembimbing sub-stase KODIL.
  4. **Sinkronisasi Otomatis Dosen Terakhir (Poin 10)**: Jika di jadwal aktif Admin mengubah dosen pembimbing (misal karena dosen sebelumnya berhalangan di tengah jalan), lembar histori di menu **Riwayat Kelompok** akan otomatis ikut terupdate menampilkan nama dosen baru tersebut sebagai pembimbing terakhir.
  5. **Hapus Riwayat (Khusus Admin)**: Admin dapat menghapus data riwayat yang tidak valid dengan mengklik ikon **Hapus (Tempat sampah berwarna merah)** pada baris tabel histori.

---

### Poin 11: Edit Username & Password Mandiri via Profil Sidebar
> [!TIP]
> **Deskripsi Perubahan**: Pengguna dengan role apa saja (Admin, Pengelola, Dosen, Mahasiswa) kini dapat merubah **Username** dan **Password** akun mereka sendiri secara mandiri langsung dari menu profil di sidebar.

* **Letak Menu**: 
  * Tersedia di bagian **kiri bawah Sidebar** (di atas tombol Keluar Akun) di halaman mana saja.
* **Cara Menggunakan**:
  1. Klik kotak nama/profil Anda di kiri bawah sidebar (yang menampilkan nama, role, dan inisial avatar Anda).
  2. Sebuah modal **Edit Profil** akan terbuka secara melayang di tengah layar.
  3. Ketik **Username Baru** Anda di kolom yang tersedia.
  4. Jika Anda juga ingin mengubah password, ketik **Password Baru** Anda, lalu ulangi pengetikan password di kolom **Konfirmasi Password Baru**.
  5. Klik tombol **Simpan**. 
  6. Sistem akan memproses perubahan ke database:
     * Jika sukses, nama Anda di sidebar akan langsung terupdate dengan nama baru secara instan tanpa perlu logout.
     * Jika username baru sudah digunakan oleh orang lain, kotak pesan kesalahan merah akan muncul untuk meminta Anda memasukkan username lain.

---

*Dengan seluruh pembaharuan di atas, sistem E-Scheduling Koas FKKH kini jauh lebih fleksibel, otomatis dalam pencatatan sejarah koas mahasiswa, tangguh dalam mendeteksi bentrok jadwal dosen, serta memberikan kemudahan akses bagi setiap pengguna untuk mengelola akun pribadinya.*
