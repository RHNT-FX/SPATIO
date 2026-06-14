import numpy as np
import json
import time
import argparse
import sys
import cv2
import requests
import threading
from flask import Flask, Response

try:
    import depthai as dai
except ImportError:
    pass # Will handle this gracefully in main()

# --- Flask Server Setup for MJPEG Streaming ---
app = Flask(__name__)
global_frame = None
frame_lock = threading.Lock()

def generate_frames():
    global global_frame
    while True:
        with frame_lock:
            if global_frame is None:
                continue
            # Encode frame
            ret, buffer = cv2.imencode('.jpg', global_frame)
            frame = buffer.tobytes()
            
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        time.sleep(0.05) # Limit to ~20 fps to save CPU

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

# --- Edge AI Core Logic ---
def generate_mock_depth_map(base_depth=800, noise_level=5, shape=(400, 640)):
    """Generates a noisy flat surface depth map."""
    noise = np.random.normal(0, noise_level, shape).astype(np.float32)
    return np.full(shape, base_depth, dtype=np.float32) + noise

def create_depthai_pipeline():
    """Configures the OAK-D hardware pipeline for stereo depth."""
    pipeline = dai.Pipeline()

    monoLeft = pipeline.create(dai.node.MonoCamera)
    monoRight = pipeline.create(dai.node.MonoCamera)
    depth = pipeline.create(dai.node.StereoDepth)
    xoutDepth = pipeline.create(dai.node.XLinkOut)

    xoutDepth.setStreamName("depth")

    monoLeft.setResolution(dai.MonoCameraProperties.SensorResolution.THE_400_P)
    monoLeft.setBoardSocket(dai.CameraBoardSocket.CAM_B)
    monoLeft.setFps(5) # Set to 5 FPS for USB 2.0 compatibility
    monoRight.setResolution(dai.MonoCameraProperties.SensorResolution.THE_400_P)
    monoRight.setBoardSocket(dai.CameraBoardSocket.CAM_C)
    monoRight.setFps(5) # Set to 5 FPS for USB 2.0 compatibility

    depth.setDefaultProfilePreset(dai.node.StereoDepth.PresetMode.DEFAULT)
    depth.setDepthAlign(dai.CameraBoardSocket.CAM_B)

    monoLeft.out.link(depth.left)
    monoRight.out.link(depth.right)
    depth.depth.link(xoutDepth.input)

    camRgb = pipeline.create(dai.node.ColorCamera)
    xoutRgb = pipeline.create(dai.node.XLinkOut)
    xoutRgb.setStreamName("rgb")
    camRgb.setBoardSocket(dai.CameraBoardSocket.CAM_A)
    camRgb.setResolution(dai.ColorCameraProperties.SensorResolution.THE_1080_P)
    camRgb.setFps(5) # Set to 5 FPS to avoid crashing the USB 2.0 connection
    camRgb.setIspScale(1, 3) # Scales 1080p to 640x360
    camRgb.setInterleaved(False)
    camRgb.setColorOrder(dai.ColorCameraProperties.ColorOrder.BGR)
    camRgb.isp.link(xoutRgb.input)

    return pipeline

def main():
    global global_frame
    
    parser = argparse.ArgumentParser()
    parser.add_argument('--mock', action='store_true', help="Run with mock data instead of real OAK-D Lite")
    parser.add_argument('--visual', action='store_true', help="Show visual pop-up window with bounding boxes")
    parser.add_argument('--endpoint', type=str, help="HTTP URL to POST the JSON data to (e.g. http://localhost:3000/api/data)")
    args = parser.parse_args()

    # Start Flask MJPEG Server in a background thread
    flask_thread = threading.Thread(target=lambda: app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False))
    flask_thread.daemon = True
    flask_thread.start()
    print("📡 MJPEG Video Stream started on http://0.0.0.0:5000/video_feed")

    # --- Setup ---
    frame_shape = (400, 640) 
    baseline_depth_map = None
    subsidence_threshold_mm = 20.0 
    last_print_time = 0
    start_time = time.time() 

    print("🚀 Starting Volumetric Core...")
    if args.visual:
        print("🖥️  Visual Mode: ENABLED (Will show pop-up windows)")
    else:
        print("🖥️  Visual Mode: DISABLED (Headless terminal only. Use --visual to see pop-ups)")
        
    device = None
    depth_queue = None
    rgb_queue = None

    if args.mock:
        print("🔧 Mode: MOCK DATA (Simulation)")
    else:
        if 'depthai' not in sys.modules:
            print("❌ ERROR: 'depthai' library not installed. Run 'pip install depthai' or use --mock.")
            return
        
        print("🎥 Mode: OAK-D Lite (Hardware)")
        print("🔌 Connecting to camera...")
        try:
            pipeline = create_depthai_pipeline()
            device = dai.Device(pipeline, maxUsbSpeed=dai.UsbSpeed.HIGH)
            depth_queue = device.getOutputQueue(name="depth", maxSize=4, blocking=False)
            rgb_queue = device.getOutputQueue(name="rgb", maxSize=4, blocking=False)
            print("✅ Camera connected successfully!")
        except Exception as e:
            print(f"❌ Failed to connect to OAK-D Lite. Is it plugged in? Error: {e}")
            return

    # Take a baseline
    print("⏳ Capturing Baseline (Keep camera perfectly still!)...")
    if args.mock:
        baseline_depth_map = generate_mock_depth_map(shape=frame_shape)
    else:
        time.sleep(2)
        inDepth = depth_queue.get()
        baseline_depth_map = inDepth.getFrame().astype(np.float32)
        
    print("✅ Baseline set. Monitoring for Volume Loss (Subsidence)...")

    try:
        while True:
            current_time = time.time()
            is_swabakar = False

            # 1. Get Real-time Depth Map
            if args.mock:
                current_depth_map = generate_mock_depth_map(shape=frame_shape)
                elapsed_time = current_time - start_time
                cycle = int((elapsed_time // 10) % 4)
                is_collapsed = (cycle == 1 or cycle == 3)
                is_swabakar = (cycle == 3)

                if is_collapsed:
                    center_y, center_x = frame_shape[0]//2 + 50, frame_shape[1]//2 - 100
                    radius = 80
                    y, x = np.ogrid[-center_y:frame_shape[0]-center_y, -center_x:frame_shape[1]-center_x]
                    mask = x*x + y*y <= radius*radius
                    current_depth_map[mask] += 100.0  
            else:
                inDepth = depth_queue.get()
                current_depth_map = inDepth.getFrame().astype(np.float32)
                inRgb = rgb_queue.tryGet()
                if inRgb is not None:
                    current_rgb_frame = inRgb.getCvFrame()
                else:
                    current_rgb_frame = None

            # 2. Differential Processing
            max_depth_mm = 1500.0
            valid_mask = (current_depth_map > 0) & (baseline_depth_map > 0) & (baseline_depth_map < max_depth_mm)
            diff_map = np.zeros_like(current_depth_map)
            diff_map[valid_mask] = current_depth_map[valid_mask] - baseline_depth_map[valid_mask]
            
            diff_map_smoothed = cv2.medianBlur(diff_map, 5)

            # 3. Thresholding & Area Filtering
            anomaly_mask = (diff_map_smoothed > subsidence_threshold_mm).astype(np.uint8) * 255
            contours, _ = cv2.findContours(anomaly_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            volume_loss_detected = False
            max_subsidence = 0.0
            valid_contours = []

            for cnt in contours:
                if cv2.contourArea(cnt) > 500:
                    valid_contours.append(cnt)
                    volume_loss_detected = True
                    
            if volume_loss_detected:
                mask = np.zeros_like(diff_map_smoothed, dtype=np.uint8)
                cv2.drawContours(mask, valid_contours, -1, 255, thickness=cv2.FILLED)
                max_subsidence = np.max(diff_map_smoothed[mask == 255])
            
            # 4. Sensor Fusion
            temp_c = 35.0 + np.random.uniform(-1, 1)
            co_ppm = 120.0 + np.random.uniform(-5, 5)
            status_text = "NORMAL"
            confidence = "N/A"

            if volume_loss_detected:
                if args.mock:
                    if is_swabakar:
                        temp_c += 50.0 
                        co_ppm += 600.0
                else:
                    if np.random.random() > 0.5:
                        temp_c += 50.0 + np.random.uniform(5, 15)
                        co_ppm += 600.0 + np.random.uniform(50, 100)

                if temp_c > 60.0 and co_ppm > 400.0:
                    status_text = "CRITICAL_SWABAKAR"
                    confidence = "HIGH (Volume + Temp + CO)"
                else:
                    status_text = "OPERATIONAL_ACTIVITY"
                    confidence = "LOW (Volume loss only, no heat/gas)"

            # 5. Data Serialization
            payload = {
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
                "status": status_text,
                "confidence": confidence,
                "volume_loss_detected": volume_loss_detected,
                "max_subsidence_mm": round(float(max_subsidence), 2),
                "mock_sensors": {
                    "temperature_c": round(temp_c, 2),
                    "co_ppm": round(co_ppm, 2)
                }
            }
            
            if volume_loss_detected or (current_time - last_print_time >= 1.0):
                if args.endpoint:
                    try:
                        requests.post(args.endpoint, json=payload, timeout=0.5)
                    except requests.exceptions.RequestException as e:
                        pass
                last_print_time = current_time

            # 6. MJPEG Stream Processing (Always run this so web gets video)
            display_map = np.clip((current_depth_map - 700) / 300 * 255, 0, 255).astype(np.uint8)
            heatmap = cv2.applyColorMap(display_map, cv2.COLORMAP_JET)
            color = (0, 255, 0) # Green for normal
            
            if volume_loss_detected:
                color = (0, 0, 255) if is_swabakar else (0, 165, 255)
                for cnt in valid_contours:
                    x, y, w, h = cv2.boundingRect(cnt)
                    cv2.rectangle(heatmap, (x, y), (x+w, y+h), color, 3)
                    label = f"SUBSIDENCE: {int(max_subsidence)}mm"
                    cv2.putText(heatmap, label, (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

            cv2.putText(heatmap, f"STATUS: {status_text}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

            with frame_lock:
                global_frame = heatmap.copy()

            # 7. Local Visual Mode
            if args.visual:
                cv2.imshow("Volumetric Edge Camera (Depth)", heatmap)
                if not args.mock and current_rgb_frame is not None:
                    cv2.imshow("Real World View (RGB)", current_rgb_frame)
                
                key = cv2.waitKey(20) & 0xFF
                if key == ord('q'):
                    break
            else:
                if args.mock:
                    time.sleep(0.1)
            
    except KeyboardInterrupt:
        print("\n🛑 Execution stopped by user.")
    finally:
        if args.visual:
            cv2.destroyAllWindows()
        if device is not None:
            device.close()

if __name__ == "__main__":
    main()
