import React, { useRef, useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';


const ImageAnnotationModal = ({ isOpen, onClose, selectedImages }) => {
  const canvasRef = useRef(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [annotations, setAnnotations] = useState([]);

  useEffect(() => {
    setAnnotations([]);
  }, [currentImageIndex]);

  const handleAnnotation = () => {
    // Implement the logic to generate YOLO annotations
    // You can access the canvas context using canvasRef.current.getContext('2d')
    // Retrieve the annotation data and process it to generate the YOLO format
    // Return or display the YOLO annotations as desired
  };

  const handleCanvasMouseDown = (event) => {
    setIsDrawing(true);
    const { offsetX, offsetY } = event.nativeEvent;
    setAnnotations([...annotations, { startX: offsetX, startY: offsetY }]);
  };

  const handleCanvasMouseMove = (event) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = event.nativeEvent;
    const updatedAnnotations = [...annotations];
    const currentAnnotation = updatedAnnotations[updatedAnnotations.length - 1];
    currentAnnotation.width = offsetX - currentAnnotation.startX;
    currentAnnotation.height = offsetY - currentAnnotation.startY;
    setAnnotations(updatedAnnotations);
    drawAnnotations();
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
  };

  const drawAnnotations = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    annotations.forEach((annotation) => {
      ctx.beginPath();
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.rect(annotation.startX, annotation.startY, annotation.width, annotation.height);
      ctx.stroke();
    });
  };

  const handlePreviousImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : selectedImages.length - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex < selectedImages.length - 1 ? prevIndex + 1 : 0));
  };

  return (
    <Modal show={isOpen} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Image Annotation</Modal.Title>
      </Modal.Header>
      <Modal.Body className="d-flex justify-content-center align-items-center">
        {selectedImages && selectedImages.length > 0 ? (
          <div>
            <div className="image-container">
              <button onClick={handlePreviousImage}><FontAwesomeIcon icon={faChevronLeft} /></button>
              <img src={"/" + selectedImages[currentImageIndex].path.split('/').pop()} alt="Selected Image" style={{ width: "430px", height: '400px', objectFit: 'contain' }} className="centered-image" />
              <button onClick={handleNextImage}><FontAwesomeIcon icon={faChevronRight} /></button>
            </div>
            <canvas
              ref={canvasRef}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
            />
            <Button variant="secondary" onClick={handleAnnotation}>Generate YOLO Annotations</Button>
          </div>
        ) : (
          ""
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="danger" onClick={onClose}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ImageAnnotationModal;
