import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './ProjectSite.css'; // Import the CSS file for styling
import ProjectSiteCard from './ProjectSiteCard';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { WithContext as ReactTags } from 'react-tag-input';
import ImageAnnotationModal from './AnnotationPopup';

const ProjectSite = ({ accessToken }) => {
  const [images, setImages] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const [models, setModels] = useState([]);
  const [boundingBoxesImages, setBoundingBoxImages] = useState([]);
  const [activeTab, setActiveTab] = useState(''); // Track the active tab
  const [csvUpload, setcsvUpload] = useState(false);
  const { id } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenTraining, setIsModalOpenTraining] = useState(false);
  const [isModalOpenAnnotation, setIsModalOpenAnnotation] = useState(false);
  const [files, setFiles] = useState(null);
  const [tags, setTags] = useState([{ id: 0, text: 'Wandhydrant' },
  { id: 1, text: 'Steigleitung' },
  { id: 2, text: 'Loeschwasserleitung' },
  { id: 3, text: 'Feuerloescher' },
  { id: 4, text: 'Feuerloescher-Schild' },
  { id: 5, text: 'Brandmelder' },
  { id: 6, text: 'Rauchmelder' },
  { id: 7, text: 'Sirene' },
  { id: 8, text: 'Hausalarmschalter' },
  { id: 9, text: 'Rauchabzugschalter' },
  { id: 10, text: 'Notausgang-Schild' },
  { id: 11, text: 'Sprinkler' },
  { id: 12, text: 'Flucht- und Rettungsplan' },
  { id: 13, text: 'Steckdose' },]);
  const [imageSize, setImageSize] = useState('');
  const [epochLength, setEpochLength] = useState('');
  const [batchSize, setBatchSize] = useState('');
  const [modelID, setModelID] = useState('');
  const [isLoadingTraining, setIsLoadingTraining] = useState(false);
  const [isLoadingRanking, setIsLoadingRanking] = useState(false);
  const [isLoadingAnnotating, setLoadingAnnotating] = useState(false);
  const [isLoadingPredict, setLoadingPredict] = useState(false);
  const [isLoadingValidation, setLoadingValidation] = useState(false);
  const [tagsAnnotations, setTagsAnnotations] = useState([{ id: 0, text: 'Wandhydrant' },
  { id: 1, text: 'Steigleitung' },
  { id: 2, text: 'Loeschwasserleitung' },
  { id: 3, text: 'Feuerloescher' },
  { id: 4, text: 'Feuerloescher-Schild' },
  { id: 5, text: 'Brandmelder' },
  { id: 6, text: 'Rauchmelder' },
  { id: 7, text: 'Sirene' },
  { id: 8, text: 'Hausalarmschalter' },
  { id: 9, text: 'Rauchabzugschalter' },
  { id: 10, text: 'Notausgang-Schild' },
  { id: 11, text: 'Sprinkler' },
  { id: 12, text: 'Flucht- und Rettungsplan' },
  { id: 13, text: 'Steckdose' },]);
  const [diversitySamplingActive, setDiversitySamplingActive] = useState(false);


  function handleImageSizeChange(event) {
    setImageSize(event.target.value);
  }

  function handleEpochLengthChange(event) {
    setEpochLength(event.target.value);
  }

  function handleBatchSizeChange(event) {
    setBatchSize(event.target.value);
  }


  function handleTagChange(newTags) {
    setTags(newTags);
  }

  const setModelTrainingID = (model) => {
    setModelID(model)
  }

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setcsvUpload(false) //To reset csv
  };

  const openModalAnnotation = () => {
    setIsModalOpenAnnotation(true)
    getImagesOfProject()
  }

  const closeModalAnnotation = () => {
    setIsModalOpenAnnotation(false)
  }

  const openModalTraining = () => {
    setIsModalOpenTraining(true);
    getModelsOfProject();
    getImagesOfProject();
    getAnnotationsOfProject();
  };

  const closeModalTraining = () => {
    setIsModalOpenTraining(false);
  };

  const setLoadingAnnotation = (boolean) => {
    setLoadingAnnotating(boolean)
  }

  const getImagesOfProject = () => {
    const url = `http://127.0.0.1:8000/get_images_by_project/${id}`;
    axios
      .get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setImages(res.data);
          console.log("hello2");
        } else{
          setImages("")
        }
      });
  };

  const uploadCSV = () => {
    openModal()
    setcsvUpload(true)
  }

  const getModelsOfProject = () => {
    const url = `http://127.0.0.1:8000/get_models_by_project/${id}`;
    axios
      .get(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setModels(res.data);
        } else{
          setModels("")
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
        } else{
          setAnnotations("")
        }
      });
  };

  const rankImages = () => {
    setIsLoadingRanking(true)
    if(!models){
      alert("No Models uploaded!")
      setIsLoadingRanking(false)
    } else{
      const url = `http://127.0.0.1:8000/get_rankings_of_images/${id}/${diversitySamplingActive.toString()}`;
      axios
        .get(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((res) => {
          setImages(res.data)
          setIsLoadingRanking(false)
        });
    }
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

    if(tab === "demo"){
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
      const isCSVFile = file.name.endsWith('.csv');
      formData.append('file', file);
      switch(activeTab){
        case "images":
          url = `http://127.0.0.1:8000/upload_images_input/${id}`;
          break;
        case "annotations":
          desiredImage = images.find(image => image.name.split('.')[0] === file.name.split('.')[0]);
          if(!desiredImage){
            alert("One or more images not in this project! Please check again if all txt files have a corresponding image!")
            break;
          }
          id_desiredImage = desiredImage._id
          url = `http://127.0.0.1:8000/upload_annotations_input/${id}/${id_desiredImage}`;
          break;
        case "models":
          url = `http://127.0.0.1:8000/upload_models_input/${id}`;

          if(csvUpload){

            if(!isCSVFile){
              alert("It needs to be a csv file!")
              url = ""
              setcsvUpload(false)
              break;
            }

            url = `http://127.0.0.1:8000/upload_csv/${id}`
            setcsvUpload(false)
          }
          break;
      }
      if(url){
          axios
            .post(url, formData, {
              headers: {  Authorization: `Bearer ${accessToken}`, 'Content-Type': file.type }
            })
            .then((res) => {

            })
            .catch((err) => {
              console.log(err);
            });
        }
      });

    closeModal()
  }

  const handleSubmitUploadTraining = () => {
    //Check if models or annotations even exist
    if(!models){
      alert("There are no models!")
      return
    }

    if(!annotations){
      alert("There are no annotations!")
      return
    }
    //Error handlings
    const classNames = tags.map(tag => tag.text)
    const hasSelected = Object.values(models).some(model => model.selected === true);
    const selectedImages = images.some(image => image.selected === true)
    const countSelectedImages = Object.values(images).filter(image => image.selected === true)
    console.log(countSelectedImages)
    const selectedModels = Object.values(models).filter(model => model.selected === true);
    const isSelectedImageAnnotated = images
    .filter(image => image.selected)
    .every(selectedImage =>
    annotations.some(annotation => annotation.image_id === selectedImage._id)
    );
    if(!hasSelected){
      alert("You need to select a model! (Only one!)")
    } else if(selectedModels.length > 1){
      alert("Only select one model!")
    } else if(!modelID || !imageSize || !epochLength || !batchSize || !classNames){
      alert("Fill out all the data! (If this is already the case then reselect the model) ")
    } else if(countSelectedImages.length < 3){
      alert("Please select atleast more than two images.")
    }else if(!isSelectedImageAnnotated){
      alert("Some of the selected images dont have annotations!")
    } else {
      let url = `http://127.0.0.1:8000/prepare_selected_for_training/${id}`;
      axios
        .get(url,{
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((res) => {
        });
      setIsLoadingTraining(true)
      const data = {models_id : modelID,image_size:imageSize,epoch_len:epochLength,batch_size:batchSize,class_names:classNames}
      url = `http://127.0.0.1:8000/train_model/${id}`
      axios
        .post(url, data, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .then((res) => {
          setIsLoadingTraining(false)
        });
      closeModalTraining()
      setBatchSize("")
      setEpochLength("")
      setImageSize("")
    }
  }

  const predictImages = () =>{
    //Check if models or annotations even exist
    if(!models){
      alert("There are no models!")
      return
    }
    //Error Handling
    const hasSelected = Object.values(models).some(model => model.selected === true);
    const selectedModels = Object.values(models).filter(model => model.selected === true);
    if(!hasSelected){
      alert("Please select a model!")
    }  else if(selectedModels.length > 1){
      alert("Only select one model!")
    } else{
      setLoadingPredict(true)
      const url = `http://127.0.0.1:8000/predict_images/${id}`
      axios
      .get(url, {
        headers: {  Authorization: `Bearer ${accessToken}`},
            })
        .then((res) => {
          setBoundingBoxImages(res.data)
          setLoadingPredict(false)
          console.log(res.data)
        })
        .catch((err) => {
            console.log(err);
        });
    }
  }

  const validateModel = () => {
    const hasSelected = Object.values(models).some(model => model.selected === true);
    const selectedModels = Object.values(models).filter(model => model.selected === true);
    if(!hasSelected){
      alert("Please select a model!")
    }  else if(selectedModels.length > 1){
      alert("Only select one model!")
    } else{
      setLoadingValidation(true)
      const url = `http://127.0.0.1:8000/validate_model/${id}`
      axios
      .get(url, {
        headers: {  Authorization: `Bearer ${accessToken}`},
            })
        .then((res) => {
          setLoadingValidation(false)
          console.log(res.data)
        })
        .catch((err) => {
            console.log(err);
        });
    }
  }

  const handleCheckboxChange = (event) => {
    const { checked } = event.target;
    setDiversitySamplingActive(checked);
  };

  return (
    <div className="project-site">
      <Modal
        show={isModalOpen}
      >
        <Modal.Header>
          <Modal.Title>
            {activeTab === 'images' && 'Upload Images'}
            {activeTab === 'annotations' && 'Upload Annotations'}
            {activeTab === 'models' && !csvUpload && 'Upload Models'}
            {activeTab === 'models' && csvUpload && 'Upload CSV'}
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

      <Modal
        show={isModalOpenTraining}
      >
        <Modal.Header>
          <Modal.Title>
            Start Training
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="input-row">
            <label>Image Size:</label>
            <input onChange={handleImageSizeChange} type="number" name="imageSize" className="long-input" />
          </div>

          <div className="input-row">
            <label>Epoch Length:</label>
            <input onChange={handleEpochLengthChange} type="number" name="epochLength" className="long-input" />
          </div>

          <div className="input-row">
            <label>Batch Size:</label>
            <input onChange={handleBatchSizeChange} type="number" name="batchSize" className="long-input" />
          </div>

          <div className="input-row">
            <label>Class Names:</label>
            <ReactTags
              tags={tags}
              handleDelete={(index) => handleTagChange(tags.filter((_, i) => i !== index))}
              handleAddition={(tag) => handleTagChange([...tags, tag])}
              placeholder="Add class names"
              classNames={{
                tags: 'tag-container',
                tagInput: 'tag-input',
                tag: 'tag',
                remove: 'tag-remove',
                suggestions: 'tag-suggestions',
                activeSuggestion: 'tag-active-suggestion',
              }}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModalTraining}>
            Cancel
          </Button>
          <Button variant="danger" onClick={()=> handleSubmitUploadTraining()}>
            Submit
          </Button>
        </Modal.Footer>
      </Modal>

      {isModalOpenAnnotation && (
        <div>
          <ImageAnnotationModal tagsAnnotations={tagsAnnotations} setTagsAnnotations={setTagsAnnotations} setLoadingAnnotation={setLoadingAnnotation} isLoadingAnnotating={isLoadingAnnotating} project_id={id} accessToken={accessToken} isOpen={openModalAnnotation} onClose={closeModalAnnotation} selectedImages={Object.values(images).filter((image) => image.selected === true)}/>
        </div>
      )}

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
          <button
            className={activeTab === 'demo' ? 'active' : ''}
            onClick={() => handleTabChange('demo')}
          >
            Demo
          </button>
        </div>
        <div className="tab-buttons">
          {activeTab === 'images' && (
            <>
              <button className='addButton'  onClick={rankImages}>
                Rank Images
                {isLoadingRanking && <div className="loading-circle"></div>}
              </button>
              <button className='addButton'  onClick={openModal}>Add Images</button>
              <div className="form-check form-switch">
                <input className="form-check-input" type="checkbox" id="checkbox" onChange={handleCheckboxChange} />
                <label className="form-check-label" htmlFor="checkbox">Diversity Sampling</label>
              </div>
            </>
          )}
          {activeTab === 'annotations' && (
            <>
              <button  onClick={openModal}>Add Annotations</button>
              <button onClick={openModalAnnotation}>Make Annotations</button>
            </>
          )}
          {activeTab === 'models' && (
            <>
              <button  onClick={openModal}>Add Models</button>
              <button onClick={openModalTraining}>
                Start Training
                {isLoadingTraining && <div className="loading-circle"></div>}
              </button>
              <button onClick={validateModel}>
                Validation
                {isLoadingValidation && <div className="loading-circle"></div>}
              </button>
              <button onClick={uploadCSV}>
                Upload CSV
              </button>

            </>
          )}
          {activeTab === 'demo' && (
            <>
              <button onClick={predictImages}>
                Predict
                {isLoadingPredict && <div className="loading-circle"></div>}
              </button>

            </>
          )}
        </div>
      </div>

      {/* Tab content */}
      <div className="tab-content">

            {activeTab === 'images' && images && (
          <div className="card-grid">
            {images.sort((a,b) => a.ranking - b.ranking).map((image, index) => (
              <ProjectSiteCard id={id} access_token={accessToken} key={index} data={image} type="images" />
            ))}
          </div>
        )}

        {activeTab === 'annotations' && annotations && (
          <div className="card-grid">
            {annotations.map((annotation, index) => (
              <ProjectSiteCard id={id} access_token={accessToken} key={index} data={annotation} type="annotations" />
            ))}
          </div>
        )}
        {activeTab === 'models' && models && (
          <div className="card-grid">
            {models.map((model, index) => (
              <ProjectSiteCard id={id} access_token={accessToken} key={index} data={model} setModelTrainingID={setModelTrainingID} type="models" />
            ))}
          </div>
        )}
        {activeTab === 'demo' && boundingBoxesImages && (
          <div className="card-grid">
            {boundingBoxesImages.map((predictImages, index) => (
              <ProjectSiteCard id={id} access_token={accessToken} key={index} data={predictImages} type="demo" />
            ))}
          </div>)}
        </div>

    </div>
  );
}

export default ProjectSite;
