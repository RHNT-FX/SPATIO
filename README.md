# Kideco Innovation Challenge 2026: Stockpile Spontaneous Combustion Monitoring

Sistem cerdas pemantauan tambang berbasis **Edge AI (OAK-D Lite)** dan **IoT Terintegrasi** untuk deteksi dini bahaya swabakar (Spontaneous Combustion) pada stockpile batu bara. Proyek ini memadukan pembacaan deformasi spasial 3D (amblesan), suhu termal, dan gas karbon monoksida (CO) ke dalam *dashboard* kendali pusat.

##  Struktur Monorepo

Repository ini menggabungkan pengembangan *Front-End Dashboard* dan *Edge AI Python* ke dalam satu wadah untuk mempermudah integrasi tim.

```text
├── dashboard/        # React Web Dashboard & Node.js WebSockets Gateway
├── spatio_camera/    # Skrip Edge AI Python (Stereo Depth OAK-D Lite & MJPEG Stream)
└── docs/             # Dokumentasi, Prototipe HTML awal, dan Handoff
```

---

##  1. Setup & Menjalankan Dashboard (Tim UI/Web)

Dashboard dibangun menggunakan **Vite + React + TailwindCSS v4** untuk performa yang sangat cepat, serta dilengkapi dengan server **Express + Socket.io** untuk menerima data secara *real-time* dari alat IoT.

### Instalasi Dependensi
Pastikan Anda sudah menginstall [Node.js](https://nodejs.org/). Masuk ke dalam folder `dashboard` dan jalankan:
```bash
cd dashboard
npm install
```

### Menyalakan Dashboard
Anda perlu menyalakan dua layanan (dapat menggunakan terminal yang berbeda):

1. **Jalankan Backend WebSockets (Gateway):**
   ```bash
   node server.js
   ```
   *(Server akan berjalan di `http://localhost:3000`)*

2. **Jalankan Front-End Web App:**
   ```bash
   npm run dev
   ```
   *(Buka browser Anda di `http://localhost:5173`)*

---

##  2. Fitur Simulasi Manual (Untuk Keperluan Demo / Rekaman Video)

Karena sensor suhu dan gas keras (*hardware*) sesungguhnya mungkin belum dipasang pada tahap ini, tersedia panel **Remote Control Rahasia** untuk memanipulasi *Dashboard* secara instan saat pengambilan video progres 50%.

1. Pastikan `node server.js` sedang menyala.
2. Buka *Dashboard* utama di laptop untuk direkam (`http://localhost:5173`).
3. Buka HP Anda atau tab browser baru, lalu akses URL:
   >>> **`http://localhost:3000/control`** *(Ganti localhost dengan IP Laptop Anda jika menggunakan HP)*
4. Aktifkan *toggle* **"Mode Override"** di panel tersebut.
5. Geser *slider* Suhu dan Gas CO sesuka Anda. Layar *Dashboard* utama akan secara ajaib berubah dan membunyikan alarm visual jika menyentuh batas kritis, meskipun kamera fisik sedang mati!

*Fitur ini sangat berguna untuk mendemonstrasikan respon UI saat bahaya swabakar terjadi tanpa perlu membakar batu bara sungguhan.*

---

##  3. Setup & Menjalankan OAK-D Lite (Tim Hardware/AI)

Skrip inti pemrosesan 3D stereovision dan fusi sensor yang akan ditanam ke Raspberry Pi (Headless Edge Architecture). Skrip ini sekarang telah dilengkapi dengan server **Flask** bawaan untuk mengirim *Livestream Video MJPEG* langsung ke Web!

### Instalasi Dependensi
Pastikan [Python 3](https://www.python.org/) terpasang. Disarankan menggunakan *Virtual Environment*.
```bash
cd spatio_camera
python3 -m venv venv

# Aktivasi Environment (Linux/Mac)
source venv/bin/activate
# Aktivasi Environment (Windows)
# venv\Scripts\activate

pip install -r requirements.txt
```

### Menjalankan Skrip Kamera
Anda bisa mengirimkan data sekaligus menyiarkan video langsung ke *dashboard* web yang sedang menyala.

**A. Mode Hardware (Jika OAK-D Lite sudah dicolok):**
```bash
python volumetric_core.py --endpoint http://localhost:3000/api/data
```
*(Video Livestream akan otomatis tayang di `http://localhost:5000/video_feed` dan ditangkap oleh Dashboard)*

**B. Mode Simulasi (Mock Data tanpa Kamera - Untuk Testing UI):**
```bash
python volumetric_core.py --mock --endpoint http://localhost:3000/api/data
```

*(Catatan Penting: Jika dijalankan dari Raspberry Pi/komputer yang berbeda, ganti `localhost` dengan IP komputer yang menjalankan Node.js)*

---

##  Troubleshooting & Catatan Penting
- **Kamera Offline di UI**: Jika *dashboard* menampilkan teks "Kamera Offline" berwarna abu-abu pada bagian Deformasi Permukaan, itu wajar. Artinya *script* `volumetric_core.py` belum menyala atau koneksi jaringan ke perangkat OAK-D terputus.
- **Port Bentrok (Port in Use)**: Pastikan tidak ada aplikasi lain yang menggunakan `port 3000` (Node.js), `port 5000` (Flask Kamera), dan `port 5173` (Vite UI).
- **Kolaborasi Git**: Tim Dashboard fokus di folder `dashboard/`. Tim AI/Kamera fokus di `spatio_camera/`. Biasakan untuk selalu melakukan `git pull` sebelum memulai pekerjaan.

---
*© 2026 Tim clingak clinguk ITK - Karya diikutsertakan untuk Kideco Innovation Challenge.*
