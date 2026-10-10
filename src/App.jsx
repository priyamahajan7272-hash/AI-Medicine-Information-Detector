import React, { useState, useEffect } from "react";
import CameraCapture from "./components/CameraCapture";
import ImageUpload from "./components/ImageUpload";
import ResultCard from "./components/ResultCard";
import Disclaimer from "./components/Disclaimer";
import { analyzeMedicineImage } from "./services/geminiService";
import "./App.css";

export default function App() {
  const [activeTab, setActiveTab] = useState("camera"); // "camera" | "upload"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [apiKey, setApiKey] = useState(
    localStorage.getItem("medicine_detector_gemini_key") || ""
  );
  const [isKeySaved, setIsKeySaved] = useState(false);
  const [history, setHistory] = useState([]);

  // Check env key or saved key
  const envKey = import.meta.env.VITE_GEMINI_API_KEY || "";
  const effectiveKey = apiKey || envKey;

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("medicine_scan_history");
      if (stored) setHistory(JSON.parse(stored));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSaveKey = () => {
    localStorage.setItem("medicine_detector_gemini_key", apiKey.trim());
    setIsKeySaved(true);
    setTimeout(() => setIsKeySaved(false), 2000);
  };

  const processImage = async (dataUrl) => {
    setError("");
    setLoading(true);
    try {
      const data = await analyzeMedicineImage(dataUrl, "image/jpeg", apiKey || envKey);
      setResult(data);

      // Save to recent scans history (without large image for privacy/storage limits)
      const newEntry = {
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        name: data.medicineName || "Unknown",
        expiryStatus: data.expiryStatus,
        data,
      };
      const updatedHistory = [newEntry, ...history.slice(0, 4)];
      setHistory(updatedHistory);
      localStorage.setItem("medicine_scan_history", JSON.stringify(updatedHistory));
    } catch (err) {
      console.error(err);
      setError(
        err.message ||
          "Failed to process medicine image. Please ensure your Gemini API key is valid and the image is clear."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-badge">
          <span>🎓 Student Project</span> • <span>Reading & Information Tool</span>
        </div>
        <h1 className="app-title">
          <span>💊</span> AI Medicine Information Detector
        </h1>
        <p className="app-subtitle">
          Show a medicine strip or packaging to the camera to read the brand name, general purpose, basic precautions, and expiry date.
        </p>
      </header>

      {/* API Key Configuration Bar */}
      <div className="api-bar">
        <div className="api-status">
          <span className={`status-dot ${effectiveKey ? "active" : ""}`} />
          <span>
            {effectiveKey ? (
              <strong>Gemini Vision API: Ready</strong>
            ) : (
              <span style={{ color: "#d97706" }}>Gemini API Key Required</span>
            )}
          </span>
        </div>

        <div className="api-input-wrap">
          <input
            type="password"
            className="api-input"
            placeholder={
              envKey ? "Using key from .env file (or enter override here)" : "Paste Google Gemini API Key here"
            }
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <button className="btn-secondary" onClick={handleSaveKey}>
            {isKeySaved ? "Saved! ✓" : "Save Key"}
          </button>
        </div>
      </div>

      {/* Main Analysis Grid */}
      <div className="main-grid">
        {/* Left Column: Input (Camera or Upload) */}
        <div className="card">
          <h2 className="card-title">
            <span>📷</span> Capture Medicine Package
          </h2>

          <div className="tab-switcher">
            <button
              className={`tab-btn ${activeTab === "camera" ? "active" : ""}`}
              onClick={() => setActiveTab("camera")}
            >
              Live Camera
            </button>
            <button
              className={`tab-btn ${activeTab === "upload" ? "active" : ""}`}
              onClick={() => setActiveTab("upload")}
            >
              Upload Photo
            </button>
          </div>

          {activeTab === "camera" ? (
            <CameraCapture onCapture={processImage} disabled={loading} />
          ) : (
            <ImageUpload onImageSelected={processImage} disabled={loading} />
          )}

          {loading && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px",
                background: "#eff6ff",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "#1d4ed8",
                fontSize: "0.9rem",
              }}
            >
              <span className="loading-spinner" style={{ borderTopColor: "#2563eb" }} />
              <span>Analyzing package details with Gemini Vision...</span>
            </div>
          )}

          {error && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                color: "#b91c1c",
                fontSize: "0.85rem",
              }}
            >
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        {/* Right Column: Output / Result Card */}
        <div>
          {result ? (
            <ResultCard result={result} />
          ) : (
            <div className="card empty-state">
              <span className="empty-icon">🔍</span>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#334155" }}>
                No Medicine Scanned Yet
              </h3>
              <p style={{ marginTop: "6px", fontSize: "0.9rem" }}>
                Hold the medicine strip or package clearly in front of the camera or upload an image to identify its details.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Scan History (Recent Scans) */}
      {history.length > 0 && (
        <div className="card history-section">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700 }}>🕘 Recent Scans (Session History)</h3>
            <button
              style={{ background: "transparent", color: "#64748b", fontSize: "0.8rem", textDecoration: "underline" }}
              onClick={() => {
                setHistory([]);
                localStorage.removeItem("medicine_scan_history");
              }}
            >
              Clear
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" }}>
            {history.map((item) => (
              <div
                key={item.id}
                className="history-item"
                onClick={() => setResult(item.data)}
              >
                <div>
                  <strong style={{ fontSize: "0.9rem", display: "block", color: "#1e293b" }}>
                    {item.name}
                  </strong>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{item.timestamp}</span>
                </div>
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background: item.expiryStatus === "Valid" ? "#dcfce7" : "#fee2e2",
                    color: item.expiryStatus === "Valid" ? "#15803d" : "#b91c1c",
                  }}
                >
                  {item.expiryStatus}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safety & Project Disclaimer */}
      <Disclaimer />
    </div>
  );
}
