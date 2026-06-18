import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

function App() {
  // State for IoT Data
  const [currentTemp, setCurrentTemp] = useState(28.0);
  const [coGas, setCoGas] = useState(0);
  const [deformation, setDeformation] = useState(0.0);
  const [aiStatus, setAiStatus] = useState("Menunggu Data...");

  // State for camera view mode
  const [currentView, setCurrentView] = useState('heatmap');
  const [isConnected, setIsConnected] = useState(false);

  // Connect to the Node.js backend to receive OAK-D Lite telemetry
  useEffect(() => {
    const socket = io('http://localhost:3000');

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setAiStatus("Koneksi Terputus");
    });

    socket.on('telemetry', (data) => {
      // Data matching the Python volumetric_core.py payload
      if (data.mock_sensors) {
        setCurrentTemp(data.mock_sensors.temperature_c);
        setCoGas(data.mock_sensors.co_ppm);
      }
      if (data.max_subsidence_mm !== undefined) {
        setDeformation(data.max_subsidence_mm);
      }
      if (data.status) {
        setAiStatus(data.status.replace('_', ' '));
      }
    });

    return () => socket.disconnect();
  }, []);

  // Determine Risk Level based on Sensor Data
  const riskLevel = currentTemp < 45 ? 0 : currentTemp < 75 ? 1 : 2;
  
  // Clean, professional alert styling
  const riskClasses = [
    "bg-emerald-50 border-emerald-200 text-emerald-800",
    "bg-amber-50 border-amber-200 text-amber-800",
    "bg-red-50 border-red-200 text-red-800"
  ];
  const riskIcons = [
    <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
    <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
  ];
  const riskTitles = ["Aman Terkendali", "Peringatan Dini", "Bahaya Swabakar"];
  const riskDescs = [
    "Suhu tumpukan stabil. Tidak ada indikasi pembakaran internal.",
    "Peningkatan suhu terdeteksi. Segera lakukan inspeksi lapangan.",
    "Kondisi kritis! Risiko tinggi terjadinya swabakar. Lakukan pendinginan segera."
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 text-white p-2.5 rounded-lg">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path></svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 leading-tight">Sistem Pemantauan Swabakar</h1>
              <p className="text-sm text-slate-500 font-medium">Dashboard Integrasi IoT & OAK-D Lite</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-5 text-base font-medium text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              </span>
              {isConnected ? 'Backend Terhubung' : 'Backend Terputus'}
            </span>
            <div className="h-4 w-px bg-slate-300"></div>
            <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </header>

      <main className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start flex-grow">
        
        {/* Left Column: Data & Analytics */}
        <section className="lg:col-span-3 flex flex-col gap-6">
          
          <div className={`rounded-xl p-5 border flex items-start gap-4 shadow-sm transition-colors duration-300 ${riskClasses[riskLevel]}`}>
            <div className="shrink-0 mt-0.5">{riskIcons[riskLevel]}</div>
            <div>
              <h3 className="text-base font-bold mb-1">{riskTitles[riskLevel]}</h3>
              <p className="text-sm opacity-90 leading-relaxed">{riskDescs[riskLevel]}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-semibold text-slate-800">Pembacaan Sensor Real-Time</h2>
              <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full border border-blue-100">
                Status AI: {aiStatus}
              </span>
            </div>
            
            <div className="grid grid-cols-1 gap-5">
              {/* Temperature */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                      Suhu Internal (Maks)
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-slate-800">{currentTemp.toFixed(1)}</span>
                    <span className="text-sm font-semibold text-slate-500">°C</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 transition-all duration-500 rounded-full" style={{width: `${Math.min((currentTemp/120)*100, 100)}%`}}></div>
                </div>
              </div>

              {/* CO Gas */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                      Kadar Gas Karbon Monoksida
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-slate-800">{coGas.toFixed(0)}</span>
                    <span className="text-sm font-semibold text-slate-500">ppm</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 transition-all duration-500 rounded-full" style={{width: `${Math.min((coGas/800)*100, 100)}%`}}></div>
                </div>
              </div>

              {/* Deformation */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
                      Deformasi Permukaan
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    {deformation === null ? (
                        <span className="text-base font-bold text-slate-400">Kamera Offline</span>
                    ) : (
                        <>
                            <span className="text-3xl font-bold text-slate-800">{deformation.toFixed(1)}</span>
                            <span className="text-sm font-semibold text-slate-500">mm</span>
                        </>
                    )}
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-500 rounded-full ${deformation === null ? 'bg-slate-300' : 'bg-blue-500'}`} style={{width: `${deformation === null ? 0 : Math.min((deformation/50)*100, 100)}%`}}></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Camera & Livestream */}
        <section className="lg:col-span-9 flex flex-col gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex-grow flex flex-col">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Visualisasi Area Stockpile</h2>
                <p className="text-sm text-slate-500">Pilih mode tampilan untuk melihat stream dari kamera</p>
              </div>
              
              <div className="flex bg-slate-100 p-1 rounded-lg">
                {[
                  { id: 'heatmap', label: 'Heatmap Kedalaman' },
                  { id: 'normal', label: 'Kamera Normal' },
                  { id: 'thermal', label: 'Sensor Termal' },
                  { id: '3d', label: 'Peta 3D' }
                ].map(tab => (
                  <button 
                    key={tab.id} 
                    onClick={() => setCurrentView(tab.id)} 
                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                      currentView === tab.id 
                      ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' 
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200/50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Video Livestream Player */}
            <div className="relative w-full aspect-video bg-black rounded-xl flex flex-col items-center justify-center overflow-hidden shadow-inner">
                
                {currentView === 'heatmap' || currentView === 'normal' ? (
                  <>
                    {isConnected ? (
                      <img 
                        key={currentView}
                        src={currentView === 'heatmap' ? "http://localhost:5000/video_feed" : "http://localhost:5000/video_feed_rgb"} 
                        alt="OAK-D Live Stream" 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}

                    {/* Fallback Error / Placeholder */}
                    <div className={`absolute inset-0 flex flex-col items-center justify-center bg-slate-900 ${isConnected ? 'hidden' : 'flex'}`}>
                      <svg className="w-12 h-12 text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"></path>
                      </svg>
                      <p className="text-slate-400 text-sm font-medium">Video Stream Offline</p>
                      <p className="text-slate-500 text-xs mt-1">Pastikan skrip Python Edge AI sedang berjalan</p>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800">
                    <svg className="w-16 h-16 text-slate-600 mb-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                    </svg>
                    <h3 className="text-xl font-bold text-slate-300 mb-2">Dalam Tahap Pengembangan</h3>
                    <p className="text-sm text-slate-500 max-w-sm text-center">
                        Modul visualisasi <strong>{currentView === 'normal' ? 'Kamera Normal' : currentView === 'thermal' ? 'Sensor Termal' : 'Peta 3D Volumetrik'}</strong> saat ini masih berupa purwarupa (placeholder). Belum ada data hardware.
                    </p>
                  </div>
                )}

                {/* Status Overlay */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur border border-slate-200 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 flex items-center gap-2 shadow-md">
                    <span className="relative flex h-2.5 w-2.5">
                      {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    </span>
                    {isConnected ? 'LIVE - OAK-D Lite' : 'Koneksi Terputus'}
                </div>
            </div>

            <div className="mt-4 flex items-start gap-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <p className="text-sm text-blue-800">
                <strong>Simulasi Hardware Aktif:</strong> Script `volumetric_core.py` dari tim Anda sedang berjalan dan mengirimkan data tiruan secara real-time ke web ini.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
