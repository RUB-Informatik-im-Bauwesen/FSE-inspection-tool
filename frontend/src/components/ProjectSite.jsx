import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './ProjectSite.css'; // Import the CSS file for styling
import ProjectSiteCard from './ProjectSiteCard';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

const ProjectSite = ({ accessToken }) => {
  const [images, setImages] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const [models, setModels] = useState([]);
  const [activeTab, setActiveTab] = useState(''); // Track the active tab
  const { id } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [files, setFiles] = useState(null);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  


  const getImagesOfProject = () => {
    const url = `http://127.0.0.1:8000/get_images_by_project/${id}`;
    axios
      .get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setImages(res.data);
          console.log(res.data)
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

  const handleFileUpload = (event) => {
    const files = event.target.files;
    setFiles(files)
  }

  const handleSubmitUpload = () => {
    Array.from(files).forEach((file) => {
      const formData = new FormData();
      let desiredImage = ""
      let id_desiredImage = null
      let url = ""
      formData.append('file', file);
      switch(activeTab){
        case "images":
          url = `http://127.0.0.1:8000/upload_images_input/${id}`;
          break;
        case "annotations":
          desiredImage = images.find(image => image.name.split('.')[0] === file.name.split('.')[0]);
          id_desiredImage = desiredImage._id
          console.log(id_desiredImage)
          url = `http://127.0.0.1:8000/upload_annotations_input/${id}/${id_desiredImage}`;
          break;
        case "models":
          url = `http://127.0.0.1:8000/upload_models_input/${id}`;
          break;
      }
      axios
        .post(url, formData, {
          headers: {  Authorization: `Bearer ${accessToken}`, 'Content-Type': file.type }
        })
        .then((res) => {
          console.log(res);
        })
        .catch((err) => {
          console.log(err);
        });
    });

    closeModal()
  }

  return (
    <div className="project-site">
      <Modal
        show={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Upload Image Modal"
      >
      <Modal.Header closeModal>
      <Modal.Title>
        {activeTab === 'images' && 'Upload Images'}
        {activeTab === 'annotations' && 'Upload Annotations'}
        {activeTab === 'models' && 'Upload Models'}
  </Modal.Title>
      </Modal.Header>
      <Modal.Body>
      <input type="file" onChange={handleFileUpload} multiple="multiple"/>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={closeModal}>
            Cancel
        </Button>
        <Button variant="danger" onClick={()=> handleSubmitUpload()}>
            Submit
        </Button>
      </Modal.Footer>
      </Modal>
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
              <button className='addButton'  onClick={openModal}>Add Images</button>
              <button className='addButton'  onClick={rankImages}>Rank Images</button>
            </>
          )}
          {activeTab === 'annotations' && (
            <>
              <button  onClick={openModal}>Add Annotations</button>
            </>
          )}
          {activeTab === 'models' && (
            <>
              <button  onClick={openModal}>Add Models</button>
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
              <ProjectSiteCard id={id} access_token={accessToken} key={index} data={image} type="images" />
            ))}
          </div>
        )}

        {activeTab === 'annotations' && (
          <div className="card-grid">
            {annotations.map((annotation, index) => (
              <ProjectSiteCard id={id} access_token={accessToken} key={index} data={annotation} type="annotations" />
            ))}
          </div>
        )}
        {activeTab === 'models' && (
          <div className="card-grid">
            {models.map((model, index) => (
              <ProjectSiteCard id={id} access_token={accessToken} key={index} data={model} type="models" />
            ))}
    </div>
  )}
</div>

    </div>
  );
}

export default ProjectSite;
