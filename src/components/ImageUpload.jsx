import React, { useState } from "react";

export default function ImageUpload({ onImageSelected, disabled }) {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      onImageSelected(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div>
      {preview && (
        <img src={preview} alt="Medicine Package Preview" className="preview-img" />
      )}
      <div
        className={`upload-dropzone ${dragOver ? "dragover" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-input-field")?.click()}
      >
        <span style={{ fontSize: "2rem", display: "block", marginBottom: "8px" }}>📁</span>
        <p style={{ fontWeight: 600, color: "#334155" }}>
          Click to choose or drop an image of the medicine package
        </p>
        <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "4px" }}>
          Supports JPEG, PNG, WEBP (Strip, Box, or Bottle)
        </p>
        <input
          id="file-input-field"
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
