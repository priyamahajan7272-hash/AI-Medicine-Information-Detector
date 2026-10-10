import React from "react";

export default function ExpiryBadge({ status, date }) {
  const getBadgeClass = () => {
    switch ((status || "").toLowerCase()) {
      case "valid":
        return "badge-valid";
      case "expiring soon":
        return "badge-expiring";
      case "expired":
        return "badge-expired";
      default:
        return "badge-unknown";
    }
  };

  const getIcon = () => {
    switch ((status || "").toLowerCase()) {
      case "valid":
        return "✅ Valid";
      case "expiring soon":
        return "⚠️ Expiring Soon";
      case "expired":
        return "❌ Expired";
      default:
        return "❓ " + (status || "Unknown");
    }
  };

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
      <span className={`badge ${getBadgeClass()}`}>{getIcon()}</span>
      <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "#334155" }}>
        {date && date !== "Not readable" ? date : "Date not readable on package"}
      </span>
    </div>
  );
}
