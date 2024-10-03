import React, { useState } from "react";
import axios from "axios";
import "./GPT.css"; // Assuming you have a CSS file for styling

const GPT = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState("");

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result.split(",")[1]); // Remove the data URL prefix
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async () => {
    if (input.trim() === "") return;

    const userMessage = { sender: "user", text: input, image: imageBase64 ? `data:image/png;base64,${imageBase64}` : null };
    setMessages([...messages, userMessage]);

    // Print input and imageBase64 for debugging
    console.log("User Input:", input);
    console.log("Image Base64:", imageBase64);

    const payload = {
      text: input,
      context: imageBase64 ? { image: imageBase64 } : null
    };

    try {
      const response = await fetch("http://localhost:8000/get_response_from_llm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      const aiMessage = { sender: "ai", text: data.response };
      setMessages([...messages, userMessage, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
    }

    setInput("");
    setImage(null);
    setImageBase64("");
  };

  const handleUploadImage = async () => {
    if (!image) return;

    const formData = new FormData();
    formData.append("image", image);

    try {
      const response = await axios.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      const uploadedImageName = response.data.imageName; // Assuming the server returns the image name
      setImageBase64(uploadedImageName);
      const aiMessage = { sender: "ai", text: response.data.reply };
      setMessages([...messages, aiMessage]);
    } catch (error) {
      console.error("Error uploading image:", error);
    }

    setImage(null);
  };

  return (
    <div className="gpt-container">
      <div className="chat-container">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            {message.text}
            {message.image && <img src={message.image} alt="User uploaded" className="uploaded-image" />}
          </div>
        ))}
      </div>
      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Type a message..."
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
      <div className="upload-container">
        <input type="file" onChange={handleImageChange} />
        <button onClick={handleUploadImage}>Upload Image</button>
      </div>
    </div>
  );
};

export default GPT;