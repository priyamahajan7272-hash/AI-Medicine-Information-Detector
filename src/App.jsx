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
  
  // User custom key from localStorage (only required if server/default key expires or fails)
  const [userApiKey, setUserApiKey] = useState(
    localStorage.getItem("medicine_detector_user_gemini_key") || ""
  );
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyPromptReason, setKeyPromptReason] = useState("");
  const [tempKeyInput, setTempKeyInput] = useState("");

  const [history, setHistory] = useState([]);

  // Check if a default server key is available in environment
  const serverKeyAvailable = Boolean(
    import.meta.env.VITE_GEMINI_API_KEY &&
    import.meta.env.VITE_GEMINI_API_KEY.trim() !== "" &&
    import.meta.env.VITE_GEMINI_API_KEY !== "your_gemini_api_key_here"
  );

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("medicine_scan_history");
      if (stored) setHistory(JSON.parse(stored));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSaveUserKey = () => {
    if (!tempKeyInput.trim()) return;
    localStorage.setItem("medicine_detector_user_gemini_key", tempKeyInput.trim());
    setUserApiKey(tempKeyInput.trim());
    setShowKeyModal(false);
    setError("");
  };

  const handleClearUserKey = () => {
    localStorage.removeItem("medicine_detector_user_gemini_key");
    setUserApiKey("");
    setTempKeyInput("");
  };

  const processImage = async (dataUrl) => {
    setError("");
    setLoading(true);

    // Active key: User override if provided, otherwise default server key
    const activeKey = userApiKey || import.meta.env.VITE_GEMINI_API_KEY || "";

    if (!activeKey) {
      setKeyPromptReason("No API key configured on the server. Please provide a free Gemini API key to continue.");
      setShowKeyModal(true);
      setLoading(false);
      return;
    }

    try {
      const data = await analyzeMedicineImage(dataUrl, "image/jpeg", activeKey);
      setResult(data);

      // Save to recent scans history
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
      console.error("Scan error:", err);

      // If the server key or active key expired/quota exceeded/invalid
      if (err.isKeyIssue || err.message === "NO_API_KEY") {
        setKeyPromptReason(
          "The current API key has expired, reached its quota limit, or is invalid. Please enter your free Google Gemini API key to proceed."
        );
        setShowKeyModal(true);
      } else {
        setError(
          err.message ||
            "Failed to process medicine image. Please ensure the package is well-lit and clearly visible."
        );
      }
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

      {/* User Key Active Notice (Only shows if user has custom key active) */}
      {userApiKey && (
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "10px",
            padding: "10px 16px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.85rem",
            color: "#166534",
          }}
        >
          <span>
            🔑 <strong>Custom Gemini API Key active:</strong> ••••••••{userApiKey.slice(-4)}
          </span>
          <button
            onClick={handleClearUserKey}
            style={{
              background: "transparent",
              color: "#dc2626",
              fontSize: "0.8rem",
              textDecoration: "underline",
              fontWeight: 600,
            }}
          >
            Reset to Server Key
          </button>
        </div>
      )}

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

      {/* Modal Prompt: Only shown when Server Key expires/exhausts/fails */}
      {showKeyModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              padding: "28px",
              maxWidth: "500px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <span style={{ fontSize: "1.8rem" }}>⚠️</span>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#1e293b" }}>
                API Key Expired or Required
              </h3>
            </div>

            <p style={{ fontSize: "0.9rem", color: "#475569", lineHeight: 1.5, marginBottom: "16px" }}>
              {keyPromptReason || "The server's Gemini API key has expired or reached its free tier limit. Enter a free Google Gemini key to continue scanning."}
            </p>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                Google Gemini API Key
              </label>
              <input
                type="password"
                placeholder="Paste AIzaSy... key here"
                value={tempKeyInput}
                onChange={(e) => setTempKeyInput(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.9rem",
                  boxSizing: "border-box",
                }}
              />
              <span style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px", display: "block" }}>
                You can get a free key instantly at{" "}
                <a
                  href="https://aistudio.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#2563eb", textDecoration: "underline" }}
                >
                  aistudio.google.com
                </a>
              </span>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                className="btn-secondary"
                onClick={() => setShowKeyModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                style={{ flex: "none", padding: "10px 20px" }}
                disabled={!tempKeyInput.trim()}
                onClick={handleSaveUserKey}
              >
                Use My Key & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
