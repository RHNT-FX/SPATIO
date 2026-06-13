# Kideco Innovation Challenge 2026: Stockpile Spontaneous Combustion Monitoring

Sistem cerdas pemantauan tambang berbasis **Edge AI (OAK-D Lite)** dan **IoT Terintegrasi** untuk deteksi dini bahaya swabakar (Spontaneous Combustion) pada stockpile batu bara. Proyek ini memadukan pembacaan deformasi spasial 3D (amblesan), suhu termal, dan gas karbon monoksida (CO) ke dalam *dashboard* kendali pusat.

## 🏗 Struktur Monorepo

Repository ini menggabungkan pengembangan *Front-End Dashboard* dan *Edge AI Python* ke dalam satu wadah untuk mempermudah integrasi tim.

```text
├── dashboard/        # React Web Dashboard & Node.js WebSockets Gateway
├── spatio_camera/    # Skrip Edge AI Python (Stereo Depth OAK-D Lite)
└── docs/             # Dokumentasi, Prototipe HTML awal, dan Handoff
```

---

## 🚀 1. Setup & Menjalankan Dashboard (Tim UI/Web)

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

## 📷 2. Setup & Menjalankan OAK-D Lite (Tim Hardware/AI)

Skrip inti pemrosesan 3D stereovision dan fusi sensor yang akan ditanam ke Raspberry Pi (Headless Edge Architecture).

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
Anda bisa mengirimkan data langsung ke *dashboard* web yang sedang menyala.

**A. Mode Hardware (Jika OAK-D Lite sudah dicolok):**
```bash
python volumetric_core.py --endpoint http://localhost:3000/api/data
```

**B. Mode Simulasi (Mock Data tanpa Kamera - Untuk Testing UI):**
```bash
python volumetric_core.py --mock --endpoint http://localhost:3000/api/data
```

*(Ganti `localhost` dengan IP Laptop tujuan jika dijalankan dari alat/komputer yang berbeda dalam satu jaringan WiFi)*

*© 2026 Tim Integrasi AI-IoT Kalimantan - Karya diikutsertakan untuk Kideco Innovation Challenge.*
