# Spatio-Temporal Stockpile Coal Combustion Simulator

An Edge AI system designed to detect **Swabakar** (spontaneous internal combustion) in massive coal stockpiles using volumetric 3D analysis and sensor fusion.

## Overview
Swabakar occurs when coal oxidizes and burns from the inside out, creating dangerous, hidden internal cavities that eventually collapse ("amblas"). This system uses an **OAK-D Lite 3D Stereo Camera** to map the physical shape of the stockpile in real-time. By calculating Z-axis differential math against a baseline snapshot, it detects sudden volume loss. 

To prevent false alarms from operational activity (like an excavator removing coal), the volumetric data is fused with Thermal and CO (Carbon Monoxide) gas sensors using a multi-factor logic gate.

## Features
*   **Hardware-in-the-Loop Stereo Vision:** Utilizes the Myriad X VPU on the OAK-D Lite for native, high-speed depth matrix calculation in real-world millimeters.
*   **Self-Calibrating Baseline:** Instantly maps the unique topology of any stockpile within 2 seconds of booting.
*   **Sensor Fusion Logic Gate:** Differentiates between routine operational volume loss (Excavators) and critical combustion events based on multi-sensor confidence grading.
*   **Headless Edge Architecture:** Runs purely in the terminal for maximum CPU efficiency, outputting a serialized JSON data stream ready for network transmission (MQTT/HTTP).
*   **Built-in Mock Simulator:** Can be tested completely without hardware using a 40-second automated state-machine.

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/IqbaltopG/SpontaneosCombustion_Volumetric3D-and-sensor
   cd kic_kideco_3dvolumetrik_oakDlite
   ```

2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv kic_env
   source kic_env/bin/activate
   pip install -r requirements.txt
   ```

## Usage

### 1. Mock Simulation (Testing without Hardware)
Run the script in mock mode to test the math and logic. The script will automatically cycle through a 40-second state machine: `Normal -> Excavator Activity -> Normal -> Swabakar Emergency`.

```bash
python volumetric_core.py --mock
```

### 2. Live Hardware Mode (OAK-D Lite)
1. Mount the OAK-D Lite securely facing your target area. Ensure it is completely rigid to prevent micro-tremors from ruining the baseline calculation.
2. Run the script:
```bash
python volumetric_core.py
```
3. The camera will take 2 seconds to adjust exposure, capture the 3D baseline, and immediately begin monitoring for subsidence. 

## Data Output Format
The system outputs a continuous JSON stream to `stdout`, ready to be ingested by a backend dashboard:

```json
{
  "timestamp": "2026-06-13T21:40:00",
  "status": "CRITICAL_SWABAKAR",
  "confidence": "HIGH (Volume + Temp + CO)",
  "volume_loss_detected": true,
  "max_subsidence_mm": 110.5,
  "mock_sensors": {
    "temperature_c": 85.2,
    "co_ppm": 712.4
  }
}
```