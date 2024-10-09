import React, { useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import "./GPT.css"; // Assuming you have a CSS file for styling

const GPT = ({ imageBase64 }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [includeImage, setIncludeImage] = useState(true); // State for the toggle

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleToggleChange = () => {
    setIncludeImage(!includeImage);
  };

  const handleSendMessage = async () => {
    if (input.trim() === "") return;

    const userMessage = {
      sender: "user",
      text: input,
      image: includeImage && imageBase64 ? `data:image/png;base64,${imageBase64}` : null,
    };
    setMessages([...messages, userMessage]);

    // Print input and imageBase64 for debugging
    console.log("User Input:", input);
    console.log("Image Base64:", imageBase64);

    const payload = {
      text: input,
      context: includeImage && imageBase64 ? { image: imageBase64 } : null,
    };

    try {
      const response = await fetch("http://localhost:8000/get_response_from_llm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      const aiMessage = { sender: "ai", text: data.response };
      setMessages([...messages, userMessage, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
    }

    setInput("");
  };

  return (
    <div className="gpt-container">
      <div className="chat-container">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.sender}`}>
            <ReactMarkdown>{message.text}</ReactMarkdown>
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
      <div className="toggle-container">
        <label>
          <input
            type="checkbox"
            checked={includeImage}
            onChange={handleToggleChange}
          />
          Include Image
        </label>
      </div>
    </div>
  );
};

export default GPT;