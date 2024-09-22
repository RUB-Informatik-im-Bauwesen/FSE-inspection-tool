import React, { useState } from "react";
import JSZip from "jszip";
import "./JsonCard.css";

export default function JsonCard({ item }) {
  const [showDetails, setShowDetails] = useState(false);

  const handleCardClick = () => {
    if (showDetails) {
      setShowDetails(false);
    }
  };

  const handleButtonClick = (e) => {
    e.stopPropagation();
    setShowDetails(true);
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    const zip = new JSZip();
    zip.file("data.json", JSON.stringify(item.data_json, null, 2));
    if (item.encoded_image) {
      const imgData = item.encoded_image
      zip.file("image.jpg", imgData, { base64: true });
    }

    const content = await zip.generateAsync({ type: "blob" });
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.href = URL.createObjectURL(content);
    downloadAnchorNode.setAttribute("download", "data.zip");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="card" onClick={handleCardClick}>
      <h2>{item.date}</h2>
      <h3>{item.timestamp}</h3>
      {item.encoded_image && (
        <img
          src={`data:image/jpeg;base64,${item.encoded_image}`}
          alt="Encoded"
          className="encoded-image"
        />
      )}
      {showDetails && (
        <div className="card-content">
          <pre>{JSON.stringify(item.data_json, null, 2)}</pre>
        </div>
      )}
      <button onClick={handleDownload}>Download</button>
      {!showDetails && <button onClick={handleButtonClick}>Show Details</button>}
    </div>
  );
}