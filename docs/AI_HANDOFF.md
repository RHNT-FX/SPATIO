# Spatio-Temporal Stockpile Coal Combustion Simulator
**Phase:** Core Volumetric Logic (Hardware-in-the-Loop)

## 1. Project Overview
This project is an Edge AI system designed to detect **Swabakar** (spontaneous combustion) in coal stockpiles. It uses a 3D camera (OAK-D Lite) to monitor the stockpile for "amblas" (volume loss/subsidence caused by internal burning) and fuses that data with Thermal and CO gas sensors to verify the anomaly.

## 2. Current Status
*   **Core Logic Written:** The main processing engine (`volumetric_core.py`) is completed.
*   **Headless Edge Architecture:** The script runs entirely in the terminal without GUI/Popups to save CPU. 
*   **Dual Mode Capability:** It supports live hardware via the `depthai` pipeline, as well as a `--mock` flag that simulates a 40-second state machine cycle for testing without hardware.
*   **Git Configured:** Repository initialized, `.gitignore` set up (ignoring `kic_env` and `Context.md`), and safely pushed to GitHub.

## 3. How the Detection Logic Works
1.  **Hardware Calibration (Stereo Vision):** The OAK-D Lite uses two lenses and a Myriad X VPU to triangulate real-world depth distances in millimeters natively. No manual physical calibration is required.
2.  **Software Calibration (Baseline Matrix):** Upon starting, the script captures a 3D snapshot (`baseline_depth_map`). It memorizes the exact shape of the specific stockpile it is looking at.
3.  **Differential Processing:** The script continually subtracts the baseline matrix from real-time frames. If a section of coal drops further away from the camera, it calculates the difference in millimeters (`max_subsidence`).
4.  **Sensor Fusion (The Logic Gate):** 
    *   If volume drops > 50mm, but Temperature & CO are normal ➡️ Flagged as `OPERATIONAL_ACTIVITY` (e.g., an excavator moved coal).
    *   If volume drops > 50mm, AND Temperature & CO spike ➡️ Flagged as `CRITICAL_SWABAKAR`.
5.  **Serialization:** The final verdict is packaged into a JSON string containing the timestamp, status, confidence level, and sensor readouts.

## 4. Hardware Deployment Plan (Future)
*   **Compute:** Raspberry Pi running headless.
*   **Connectivity:** Pre-configured via Pi Imager for Hotspot SSH access.
*   **Execution:** The Python script will be wrapped in a `systemd` daemon so it boots automatically on power-up and runs continuously in the background.
*   **Sensor Wiring:** Thermal and MQ-7 sensors will be wired to the Pi's GPIO pins (using an MCP3008 ADC for the analog MQ-7), replacing the current `np.random` mock data generator.
*   **Data Transmission:** The local `print(json)` will be upgraded to an MQTT publisher or HTTP POST request to stream telemetry to the central dashboard.
