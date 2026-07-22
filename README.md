# Nursari - Enterprise Nursery & Reclamation Management System

Nursari adalah aplikasi Enterprise Resource Planning (ERP) berbasis web modern untuk pengelolaan nurseri (pembibitan) dan pemantauan revegetasi lahan reklamasi tambang di **PT INDEXIM COALINDO (Environmental Division)**.

Aplikasi ini dikembangkan menggunakan **ASP.NET Core 10.0 MVC (C#)** dengan dukungan penuh database relasional **Microsoft SQL Server**.

---

## 🌟 Fitur Utama

1. **Executive Dashboard**: Visualisasi ringkasan KPI (Total Bibit, Total Dispatched, Rata-rata Kelangsungan Hidup Tanaman, Tingkat Target Reklamasi) terintegrasi dengan grafik Chart.js.
2. **Seedling Inventory**: Manajemen batch bibit di area green house dan bedengan nurseri berdasarkan kode Batch, spesies, dan status.
3. **Transaction Ledger**: Log pencatatan mutasi transaksi bibit masuk (*Receipt*), keluar penanaman (*Planting*), penyusutan (*Mortality*), dan audit fisik (*Stock Opname*).
4. **Visual Plot Map**: Peta visual bedengan (plot) nurseri secara real-time yang memetakan kapasitas serta tingkat keterisian bedengan (status utilitas rendah, sedang, atau penuh).
5. **Growth Monitoring**: Pencatatan data pertumbuhan fisik bibit (tinggi, diameter, kondisi daun, dan health score).
6. **Survival Analysis & Reclamation Target**: ESG Environmental dashboard untuk memantau target tahunan luasan reklamasi (hektar) versus realisasi riil serta audit indeks ketahanan hidup pasca-tanam.
7. **Autentikasi NIK Karyawan**: Sistem login terintegrasi langsung dengan database active employee `[ONE_DB_MITRA].[dbo].[vw_m_karyawan_aktif]`. Karyawan dapat masuk menggunakan **NIK** (misal: `24051940986`) dengan kata sandi default `123456`.
8. **Premium Mobile Responsive**: Desain antarmuka dinamis *Emerald Forest* dengan mode gelap/terang (Dark/Light Mode), menu hamburger slide-drawer di layar ponsel, serta tabel data dan grafik yang dioptimalkan responsif untuk handphone.

---

## 🛠️ Arsitektur Teknologi

- **Backend Framework**: ASP.NET Core 10.0 MVC (C#)
- **Data Access ORM**: Entity Framework Core (EF Core)
- **Database Server**: Microsoft SQL Server
- **Frontend Engine**: Razor Views, Vanilla CSS3 (Emerald Forest Design System), Vanilla JavaScript (Modular components)
- **Library Grafik**: Chart.js (Responsive Canvas)
- **Library Ikon**: FontAwesome Icons (CDN)

---

## 📂 Struktur Folder Proyek

```text
Nursari/
│
├── Controllers/         # Logika MVC C# (AccountController, HomeController)
├── Models/              # Kelas Entitas Database & ViewModels (User, Inventory, Ledger)
├── Views/               # Razor Templates (Tampilan modular responsive)
│   ├── Account/         # Halaman login
│   ├── Home/            # Modul dashboard, inventori, ledger, dll.
│   └── Shared/          # Layout template master & parsial
│
├── wwwroot/             # Static assets (CSS responsif, media, gambar logo)
│   ├── css/
│   │   └── site.css     # CSS Desain Sistem & Media Queries Handphone
│   └── logo_nursari.png
│
├── initial_data.json    # Objek backup data awal
├── Program.cs           # Konfigurasi Middleware & Startup Pipeline
└── Nursari.csproj       # Definisi dependensi NuGet proyek C#
```

---

## 🚀 Panduan Memulai (Setup)

### 1. Konfigurasi String Koneksi
Sebelum menjalankan aplikasi, pastikan untuk membuat file `appsettings.json` di direktori utama proyek dengan format sebagai berikut (ganti kata sandi sesuai dengan kredensial server Anda):

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": "Server=172.16.1.93;Database=DB_NURSARI;User Id=sa;Password=KATA_SANDI_DB_ANDA;TrustServerCertificate=True;"
  }
}
```

### 2. Migrasi Database & Seeding
Database `DB_NURSARI` dikelola di SQL Server. Inisialisasi skema tabel (`tbl_m_*`, `tbl_r_*`, dan `tbl_t_*`) serta seeding data awal dari `initial_data.json` dan data karyawan dari `ONE_DB_MITRA` dijalankan melalui skrip otomatisasi database yang tersedia di folder scratch internal.

### 3. Menjalankan Aplikasi
Buka terminal pada folder proyek ini, lalu jalankan perintah berikut:
```bash
dotnet restore
dotnet build
dotnet run --launch-profile http
```
Aplikasi akan aktif dan dapat diakses di browser melalui tautan: **`http://localhost:5159`**

---

## 🔒 Catatan Keamanan
- File sensitif seperti `appsettings.json` (menyimpan password sa database) dan aset video berat `.mp4` telah dikecualikan di file `.gitignore` dan **tidak ikut dipublikasikan** ke dalam repository GitHub ini demi menjaga keamanan credentials perusahaan.
