import React from "react";
import ExpiryBadge from "./ExpiryBadge";

export default function ResultCard({ result }) {
  if (!result) return null;

  return (
    <div className="card" style={{ height: "100%" }}>
      <div className="result-card-header">
        <h2 className="med-name">
          {result.identified ? result.medicineName : "Medicine Not Recognized"}
        </h2>
        {result.genericName && result.genericName !== "N/A" && (
          <p className="generic-name">
            <strong>Active Composition:</strong> {result.genericName}
          </p>
        )}
        <div className="badge-row">
          <span
            className="badge"
            style={{
              background:
                result.confidence === "High"
                  ? "#e0f2fe"
                  : result.confidence === "Medium"
                  ? "#fef3c7"
                  : "#f1f5f9",
              color:
                result.confidence === "High"
                  ? "#0369a1"
                  : result.confidence === "Medium"
                  ? "#b45309"
                  : "#64748b",
            }}
          >
            Confidence: {result.confidence || "Low"}
          </span>
          {result.manufacturer && result.manufacturer !== "Not visible" && (
            <span className="badge" style={{ background: "#f8fafc", color: "#475569" }}>
              🏢 {result.manufacturer}
            </span>
          )}
        </div>
      </div>

      {/* Expiry Date Section */}
      <div className="info-block">
        <div className="info-label">Expiry Date Status</div>
        <ExpiryBadge status={result.expiryStatus} date={result.expiryDate} />
      </div>

      {/* General Purpose / Use */}
      <div className="info-block">
        <div className="info-label">General Purpose / Use</div>
        <p className="info-text">{result.generalPurpose || "Information unavailable."}</p>
      </div>

      {/* Basic Precautions */}
      {result.basicPrecautions && result.basicPrecautions.length > 0 && (
        <div className="info-block">
          <div className="info-label">Basic Precautions & Label Warnings</div>
          <ul className="precautions-list">
            {result.basicPrecautions.map((item, idx) => (
              <li key={idx}>
                <span style={{ color: "#f59e0b" }}>⚠️</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Raw Extracted Text / Batch info if available */}
      {result.batchNumber && result.batchNumber !== "Not visible" && result.batchNumber !== "N/A" && (
        <div className="info-block">
          <div className="info-label">Batch / Lot No.</div>
          <p className="info-text" style={{ fontSize: "0.85rem", color: "#64748b" }}>
            {result.batchNumber}
          </p>
        </div>
      )}

      {result.rawExtractedText && (
        <div className="info-block" style={{ marginTop: "16px" }}>
          <div className="info-label">Extracted Package Text</div>
          <div
            style={{
              background: "#f8fafc",
              padding: "10px",
              borderRadius: "8px",
              fontSize: "0.8rem",
              color: "#64748b",
              whiteSpace: "pre-wrap",
              maxHeight: "100px",
              overflowY: "auto",
              fontFamily: "monospace",
            }}
          >
            {result.rawExtractedText}
          </div>
        </div>
      )}
    </div>
  );
}
