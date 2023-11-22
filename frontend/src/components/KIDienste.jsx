import React from 'react';
import './KIDiensteStyle.css';

const KIDienste = () => {
  return (
    <div className="visual-fire-inspection-tool-container">
      <div className="title-text-container">
        <h1 >Visual Fire Inspection Tool</h1>
        <p >Welcome to Visual Fire Inspection Tool! Please select your ML Service for your fire safety inspection.</p>
      </div>

      <div className="card-container">
        <div className="card" > {/* Adding Bootstrap class 'card-deck' */}
          <img src="water_fire_de_126.jpg" alt="Left Image" className="card-img" /> {/* Adding Bootstrap class 'card-img-top' */}
          <div className="card-body">
            <button className="card-button btn btn-secondary">Upload Image</button>
            <button className="card-button btn btn-secondary">Create Image</button>  {/* Adding Bootstrap classes 'btn' and 'btn-primary' */}
          </div>
        </div>

        {/* Buttons placed between the cards */}
        <div className="buttons-between-cards">
          <button className="bottom-button btn btn-secondary">Choose ML Service</button> {/* Adding Bootstrap classes 'btn' and 'btn-success' */}
          <button className="bottom-button btn btn-primary">Start!</button> {/* Adding Bootstrap classes 'btn' and 'btn-danger' */}
        </div>

        <div className="card card-deck"> {/* Adding Bootstrap class 'card-deck' */}
          <img src="20210803_095515.jpg" alt="Right Image" className="card-img" /> {/* Adding Bootstrap class 'card-img-top' */}
          <div className="card-body">
            <button className="card-button btn btn-secondary">Save and choose next ML Service</button>
            <button className="card-button btn btn-primary">Download Output</button>  {/* Adding Bootstrap classes 'btn' and 'btn-primary' */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KIDienste;
