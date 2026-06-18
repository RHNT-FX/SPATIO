import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  }
});

// Store manual overrides for the demo
let overrides = {
  temperature_c: null,
  co_ppm: null,
  is_active: false
};

app.post('/api/data', (req, res) => {
  let data = req.body;
  
  // Apply manual overrides if demo mode is active
  if (overrides.is_active && data.mock_sensors) {
    if (overrides.temperature_c !== null) data.mock_sensors.temperature_c = overrides.temperature_c;
    if (overrides.co_ppm !== null) data.mock_sensors.co_ppm = overrides.co_ppm;
    
    // Override status logic based on sliders
    if (data.mock_sensors.temperature_c > 75) {
        data.status = "CRITICAL_SWABAKAR";
    } else if (data.mock_sensors.temperature_c > 45) {
        data.status = "WARNING_ELEVATED_HEAT";
    } else {
        data.status = "NORMAL_STABLE";
    }
  }

  io.emit('telemetry', data);
  res.status(200).send({ success: true });
});

// Handle connections from the Control Panel
io.on('connection', (socket) => {
  // Send current state to newly connected control panels
  socket.emit('override_state', overrides);

  socket.on('set_override', (newOverrides) => {
    overrides = { ...overrides, ...newOverrides };
    io.emit('override_state', overrides); // sync multiple control panels if open

    // Memungkinkan slider bekerja meskipun kamera MATI TOTAL (tidak ada pengiriman POST)
    if (overrides.is_active) {
        let dummyData = {
            status: "NORMAL_STABLE",
            confidence: "SIMULASI_MANUAL",
            volume_loss_detected: false, // Set false saat offline
            max_subsidence_mm: null,     // Set null agar UI menampilkan "Kamera Offline"
            mock_sensors: {
                temperature_c: overrides.temperature_c !== null ? overrides.temperature_c : 35,
                co_ppm: overrides.co_ppm !== null ? overrides.co_ppm : 120
            }
        };

        if (dummyData.mock_sensors.temperature_c > 75) {
            dummyData.status = "CRITICAL_SWABAKAR";
        } else if (dummyData.mock_sensors.temperature_c > 45) {
            dummyData.status = "WARNING_ELEVATED_HEAT";
        }

        io.emit('telemetry', dummyData);
    }
  });

  socket.on('reset_baseline', async () => {
    try {
      const response = await fetch('http://localhost:5000/reset_baseline', { method: 'POST' });
      if (response.ok) {
        console.log("Successfully sent reset_baseline to Python");
      }
    } catch (e) {
      console.error("Failed to forward reset_baseline to Python:", e.message);
    }
  });
});

// Serve the Remote Control Panel HTML
app.get('/control', (req, res) => {
  res.sendFile(path.join(__dirname, 'control.html'));
});

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`Control Panel available at http://localhost:${PORT}/control`);
});
