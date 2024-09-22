import React, { useState, useEffect } from "react";
import axios from "axios";
import JsonCard from "./JsonCard"; // Import the JsonCard component

export default function ViewJsons() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/get_collection_jsons")
      .then((response) => {
        setData(response.data);
        setLoading(false);
      })
      .catch((error) => {
        setError(error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <h1>Collection JSONs</h1>
      <div className="card-container">
        {data.map((item, index) => (
          <JsonCard key={index} item={item} />
        ))}
      </div>
    </div>
  );
}