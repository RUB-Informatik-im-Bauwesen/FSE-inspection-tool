import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './ProjectSite.css'; // Import the CSS file for styling
import ProjectSiteCard from './ProjectSiteCard';

const ProjectSite = ({ accessToken }) => {
  const [images, setImages] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const [models, setModels] = useState([]);
  const [activeTab, setActiveTab] = useState(''); // Track the active tab
  const { id } = useParams();

  const getImagesOfProject = () => {
    const url = `http://127.0.0.1:8000/get_images_by_project/${id}`;
    axios
      .get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setImages(res.data);
        }
      });
  };

  const getModelsOfProject = () => {
    const url = `http://127.0.0.1:8000/get_models_by_project/${id}`;
    axios
      .get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setModels(res.data);
        }
      });
  };

  const getAnnotationsOfProject = () => {
    const url = `http://127.0.0.1:8000/get_annotations_by_project/${id}`;
    axios
      .get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setAnnotations(res.data);
        }
      });
  };

  const addImage = () => {
    // Logic to add an image to the project
  };

  const addAnnotation = () => {
    // Logic to add an annotation to the project
  };

  const addModel = () => {
    // Logic to add a model to the project
  };

  const startTraining = () => {
    // Logic to start training the models
  };

  const rankImages = () => {
    // Logic to rank the images
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "images"){
      getImagesOfProject();
    }

    if (tab === "annotations"){
      getAnnotationsOfProject();
    }

    if (tab === "models"){
      getModelsOfProject();
    }
  };

  return (
    <div className="project-site">
      <div className="button-container">
        <div className="tab-navigation">
          <button
            className={activeTab === 'images' ? 'active' : ''}
            onClick={() => handleTabChange('images')}
          >
            Images
          </button>
          <button
            className={activeTab === 'annotations' ? 'active' : ''}
            onClick={() => handleTabChange('annotations')}
          >
            Annotations
          </button>
          <button
            className={activeTab === 'models' ? 'active' : ''}
            onClick={() => handleTabChange('models')}
          >
            Models
          </button>
        </div>
        <div className="tab-buttons">
          {activeTab === 'images' && (
            <>
              <button className='addButton'  onClick={addImage}>Add Images</button>
              <button className='addButton'  onClick={rankImages}>Rank Images</button>
            </>
          )}
          {activeTab === 'annotations' && (
            <>
              <button  onClick={addAnnotation}>Add Annotations</button>
            </>
          )}
          {activeTab === 'models' && (
            <>
              <button  onClick={addModel}>Add Models</button>
              <button  onClick={startTraining}>Start Training</button>
            </>
          )}
        </div>
      </div>

      {/* Tab content */}
      <div className="tab-content">

            {activeTab === 'images' && (
          <div className="card-grid">
            {images.map((image, index) => (
              <ProjectSiteCard key={index} data={image} type="images" />
            ))}
          </div>
        )}

        {activeTab === 'annotations' && (
          <div className="card-grid">
            {annotations.map((annotation, index) => (
              <ProjectSiteCard key={index} data={annotation} type="annotations" />
            ))}
          </div>
        )}
        {activeTab === 'models' && (
          <div className="card-grid">
            {models.map((model, index) => (
              <ProjectSiteCard key={index} data={model} type="models" />
            ))}
    </div>
  )}
</div>

    </div>
  );
}

export default ProjectSite;
