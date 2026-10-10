import React, { useRef, useState, useEffect } from "react";

export default function CameraCapture({ onCapture, disabled }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  const startCamera = async (deviceId = "") => {
    setCameraError("");
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);

      // List available cameras
      const devList = await navigator.mediaDevices.enumerateDevices();
      const videoDevs = devList.filter((d) => d.kind === "videoinput");
      setDevices(videoDevs);
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError(
        "Could not access camera. Please allow camera permissions or use the file upload option."
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const handleDeviceChange = (e) => {
    const newId = e.target.value;
    setSelectedDeviceId(newId);
    startCamera(newId);
  };

  const captureFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    onCapture(dataUrl);
  };

  return (
    <div>
      <div className="camera-box">
        {cameraError ? (
          <div style={{ color: "#f87171", padding: "20px", textAlign: "center" }}>
            <p>📷 {cameraError}</p>
            <button
              className="btn-secondary"
              style={{ marginTop: "12px" }}
              onClick={() => startCamera(selectedDeviceId)}
            >
              Retry Camera
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="camera-video"
            />
            <div className="camera-guide-overlay">
              <span>Align medicine package text within box</span>
            </div>
          </>
        )}
      </div>

      {devices.length > 1 && (
        <div style={{ marginTop: "10px" }}>
          <select
            value={selectedDeviceId}
            onChange={handleDeviceChange}
            style={{
              width: "100%",
              padding: "6px 10px",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "0.85rem",
            }}
          >
            {devices.map((dev, i) => (
              <option key={dev.deviceId || i} value={dev.deviceId}>
                {dev.label || `Camera ${i + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="camera-controls">
        <button
          className="btn-primary"
          onClick={captureFrame}
          disabled={disabled || !isCameraActive}
        >
          📸 Capture & Analyze Package
        </button>
      </div>
    </div>
  );
}
