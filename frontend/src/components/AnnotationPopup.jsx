import React, { useRef, useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import "./AnnotationPopupStyle.css"
import { WithContext as ReactTags } from 'react-tag-input';
import axios from "axios"


const ImageAnnotationModal = ({ project_id, accessToken, isOpen, onClose, selectedImages }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [tags, setTags] = useState([]);

  useEffect(() => {
  }, [currentImageIndex]);

  function handleTagChange(newTags) {
    setTags(newTags);
  }

  const handlePreviousImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : selectedImages.length - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex < selectedImages.length - 1 ? prevIndex + 1 : 0));
  };

  const annotation_CVAT = () => {
    let classNames = ""
    if (tags){
      classNames = tags.map(tag => tag.text)
    }
    const data = {models_id : "0",image_size:0,epoch_len:0,batch_size:0,class_names:classNames}
    console.log(project_id)
    const url = `http://127.0.0.1:8000/annotate_on_cvat/${project_id}`
    axios
      .post(url, data,{
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((res) => {
        console.log(res.data)
      });
  }

  return (
    <Modal show={isOpen} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Image Annotation</Modal.Title>
      </Modal.Header>
      <Modal.Body className="d-flex justify-content-center align-items-center annotation-popup">
        <div>
          <div className="image-container">
            <button onClick={handlePreviousImage}><FontAwesomeIcon icon={faChevronLeft} /></button>
            <img src={"/" + selectedImages[currentImageIndex].path.split('/').pop()} alt="Selected Image" className="centered-image" />
            <button onClick={handleNextImage}><FontAwesomeIcon icon={faChevronRight} /></button>
          </div>
          <div className="tag-container">
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
          {selectedImages && selectedImages.length > 0 && (
            <Button onClick={annotation_CVAT} className='buttonCvat' variant="secondary">Generate Tasks for CVAT</Button>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="danger" onClick={onClose}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ImageAnnotationModal;
