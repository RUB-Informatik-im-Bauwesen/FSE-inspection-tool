import React, { useState, useEffect, useRef, useCallback } from 'react';
import './KIDiensteStyle.css';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import axios from 'axios';
import Dropdown from 'react-bootstrap/Dropdown';
import Webcam from 'react-webcam';


//const apiUrl = "http://127.0.0.1:8000"; // Defaults to local for testing
//const apiUrl =  "https://fse-xoztb.ondigitalocean.app/therob-1-fse-backend";
const apiUrl = import.meta.env.VITE_BACKEND_IP
const KIDienste = ({ accessToken }) => {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [files, setFiles] = useState(null);
  const [imageUpload, setImageUpload] = useState("");
  const [imageResult, setImageResult] = useState("");
  const [downloadImageName, setDownloadImageName] = useState("");
  const [selectedMLService, setSelectedMLService] = useState(null);
  const [backendTime, setBackendTime] = useState(null);
  const [inferenceTime, setInferenceTime] = useState(null);
  const [preprocessTime, setPreprocessTime] = useState(null);
  const [postprocessTime, setPostprocessTime] = useState(null);
  const [isLoadingPredict, setLoadingPredict] = useState(false);
  const [imageBase64, setImageBase64] = useState("");
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [detections, setDetections] = useState([]);
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const download_item = () => {

    if(!imageResult){
      return
    }

    let dataSource; // I have no idea what this is supposed to be for, might have to ask ayman
    const createurl = new URL(imageResult, window.location.href);
    const fileNameWithExtension = createurl.pathname.split('/').pop();
    console.log("filenamewithextension", fileNameWithExtension)
    let url = `${apiUrl}/download_image_json/${downloadImageName}`;

    const axiosConfig = {
      headers: { Authorization: `Bearer ${accessToken}` },
      responseType: 'blob',
      method: 'get',  // Use 'get' as the default method
    };

    // Conditionally add dataSource to the request
    if (dataSource) {
      axiosConfig.data = dataSource;
      axiosConfig.method = 'post';  // Change method to 'get'
    }

    axios(url,axiosConfig).then((res) => { // Create a Blob URL for the file
        console.log(res);

        const blob = new Blob([res.data], { type: res.headers['content-type'] });

        // Create a FileReader to read the blob as a data URL
        const reader = new FileReader();
        reader.onload = () => {
          // Use reader.result as your data URL
          console.log(reader.result);

          // Here you can handle the data URL as needed
          // For example, you can display an image in the browser or trigger a download
          const a = document.createElement('a');
          a.href = reader.result;

          a.download = `image.${res.headers['content-type'].split('/')[1]}`;


          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        };

        // Read the blob as a data URL
        reader.readAsDataURL(blob);
    }
      ).catch((err) => {
        console.log(err)
      })
  }

  const handleMLServiceSelect = (eventKey, event) => {
    setSelectedMLService(eventKey);
  };

  const handleFileUpload = (event) => {
    console.log(event)
    const files = event.target.files;
    setFiles(files)
    console.log(files)
  }

  const openModal = () => {
    setIsModalOpen(true);
  }

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmitUpload = () => {
      const formData = new FormData();
      console.log(files)
      formData.append('file', files[0]);
      console.log("UPLOAD")
      let url = `${apiUrl}/upload_image_KI_Dienste`;
      console.log("url", url)
      axios.post(url, formData, {
              headers: {  Authorization: `Bearer ${accessToken}`, 'Content-Type': files.type }
            })
            .then((res) => {
              console.log(res);
              const { filename, image_base64 } = res.data;
              setImageUpload(filename)
              setImageBase64(image_base64);
            })
            .catch((err) => {
              console.log(err);
            });

    console.log(imageUpload)
    closeModal()
  }

  const predict_image = () => {
    setLoadingPredict(true)

    const filePath = imageUpload;
    const fileNameWithoutExtension = filePath.split('/').pop().replace(/\.[^/.]+$/, '');
    console.log(fileNameWithoutExtension)

    if(!selectedMLService){
      alert("Please choose a ML Service!");
      return;
    }

    const url = `${apiUrl}/predict_image_KI_Dienste/${selectedMLService}/${fileNameWithoutExtension}`
      axios
      .get(url, {
        headers: {  Authorization: `Bearer ${accessToken}`},
            })
        .then((res) => {
          console.log("RES:", res)
          setImageResult(res.data[0][0])
          setDownloadImageName(res.data[0][1])
          setBackendTime(res.data[1])
          setPreprocessTime(res.data[2][0])
          setInferenceTime(res.data[2][1])
          setPostprocessTime(res.data[2][2])
          setLoadingPredict(false)
          console.log(res.data)
        })
        .catch((err) => {
            console.log(err);
        });

  }
  const navigateToViewJsons = () => {
    window.location.replace("http://localhost:5173/view-jsons");
  };
  const generateRandomString = (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };

  const capture = useCallback(async () => {

    const imageSrc = webcamRef.current.getScreenshot();
    //setIsWebcamOpen(false);

    // Convert the captured image to a File object
    const res = await fetch(imageSrc);
    const blob = await res.blob();
    const filename = generateRandomString(10) + ".jpg";
    const file = new File([blob], filename, { type: "image/jpeg" });

    // Upload to backend for object detection
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(`${apiUrl}/predict_webcam_real_time/${selectedMLService}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    //console.log(response);
    setDetections(response.data.detections);
  }, [webcamRef, selectedMLService]);

  useEffect(() => {
    if (isWebcamOpen) {
      const interval = setInterval(() => {
        capture();
      }, 500); // Capture frame every second
      return () => clearInterval(interval);
    }
  }, [isWebcamOpen, capture]);
  
  const drawMask = (mask, canvas) => {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(mask[0].length, mask.length);
    for (let y = 0; y < mask.length; y++) {
      for (let x = 0; x < mask[0].length; x++) {
        const value = mask[y][x] ? 255 : 0; // Assuming binary mask
        const index = (y * mask[0].length + x) * 4;
        imageData.data[index] = value; // R
        imageData.data[index + 1] = value; // G
        imageData.data[index + 2] = value; // B
        imageData.data[index + 3] = 127; // A (transparency)
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };


  useEffect(() => {
    if (canvasRef.current && webcamRef.current) {
      const canvas = canvasRef.current;
      const video = webcamRef.current.video;
      if (video) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawings
      detections.forEach((detection) => {
        if (detection.mask) {
          drawMask(detection.mask, canvas);
        }
      });
    }
  }, [detections, isWebcamOpen]);
/*
  const drawCompositeMask = (masks, canvas) => {
    const ctx = canvas.getContext('2d');
    const width = masks[0][0].length;
    const height = masks[0].length;
    const compositeMask = Array.from({ length: height }, () => Array(width).fill(0));

    // Combine all masks into a composite mask
    masks.forEach(mask => {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (mask[y][x]) {
            compositeMask[y][x] = 255; // Set to 255 if any mask has a value at this position
          }
        }
      }
    });

    const imageData = ctx.createImageData(width, height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const value = compositeMask[y][x];
        const index = (y * width + x) * 4;
        imageData.data[index] = value; // R
        imageData.data[index + 1] = value; // G
        imageData.data[index + 2] = value; // B
        imageData.data[index + 3] = 127; // A (transparency)
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };

  useEffect(() => {
    if (canvasRef.current && webcamRef.current) {
      const canvas = canvasRef.current;
      const video = webcamRef.current.video;
      if (video) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawings
      const masks = detections.map(detection => detection.mask).filter(mask => mask);
      if (masks.length > 0) {
        drawCompositeMask(masks, canvas);
      }
    }
  }, [detections, isWebcamOpen]);
*/
  return (
    <div className="visual-fire-inspection-tool-container">
      <div className="header-center">
        <Modal show={isModalOpen}>
          <Modal.Header>
            <Modal.Title>
              Upload Images
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <input type="file" onChange={handleFileUpload} />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleSubmitUpload}>
              Submit
            </Button>
          </Modal.Footer>
        </Modal>

        <div className="title-text-container">
          <h1>Visual Fire Inspection Tool</h1>
          <p>Welcome to Visual Fire Inspection Tool! What can I inspect for you? 😃</p>
        </div>
        {/*
        <div className="top-right-button">
          <button onClick={navigateToViewJsons} className="btn btn-primary">View all inspections</button>
        </div>
        */}
      </div>

      <div className="below-header-center">
        <div className="left-side">
          <div className="card-container">
          {!isWebcamOpen && (
            <div className="card">
              <img src={`data:image/jpeg;base64,${imageBase64}`} alt="No Input Image uploaded" />
              <div className="card-body">
                <button onClick={openModal} className="card-button btn btn-secondary">Upload Image</button>
                <button onClick={() => setIsWebcamOpen(true)} className="card-button btn btn-secondary">Use Webcam</button>
              </div>
            </div>
          )}
      {isWebcamOpen && (
        <div className="webcam-container" style={{ position: 'relative' }}>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="webcam"
            style={{ width: '100%' }}
          />
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          />
          {detections.map((detection, index) => (
            <div key={index} style={{
              position: 'absolute',
              border: '3px solid #39FF14',
              left: `${detection.x}px`,
              top: `${detection.y}px`,
              width: `${detection.width}px`,
              height: `${detection.height}px`
            }}>
              <span style={{ color: 'red' }}>{detection.label} ({Math.round(detection.confidence * 100)}%)</span>
            </div>
          ))}
        </div>
              )}
              {isWebcamOpen && (
                <button onClick={() => setIsWebcamOpen(false)} className="btn btn-secondary" style={{ marginTop: '10px' }}>Close</button>
              )}
              <div className="buttons-between-cards">
                <Dropdown onSelect={handleMLServiceSelect}>
                  <Dropdown.Toggle variant="secondary" id="dropdown-basic" style={{ width: '200px' }}>
                    {selectedMLService ? selectedMLService : "Choose ML Service"}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item eventKey="Wartungsinformationen">Detektion Wartungsinformationen</Dropdown.Item>
                    <Dropdown.Item eventKey="Prüfplakettenaufkleber">Detektion Prüfplakettenaufkleber</Dropdown.Item>
                    <Dropdown.Item eventKey="Brandschutzanlagen">Detektion Brandschutzanalgen</Dropdown.Item>
                    <Dropdown.Item eventKey="Sicherheitsschilder">Detektion Sicherheitsschilder</Dropdown.Item>
                    <Dropdown.Item eventKey="Blockiertheit_modal">Detektion Blockiertheit modal</Dropdown.Item>
                    <Dropdown.Item eventKey="Blockiertheit_amodal">Detektion Blockiertheit amodal</Dropdown.Item>
                    <Dropdown.Item eventKey="Blockiertheit_areal">Detektion Blockiertheit amodal-modal</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
                {!isWebcamOpen && (
                  <button onClick={predict_image} className="bottom-button btn btn-primary">
                    Start! {isLoadingPredict && <div className="loading-circle"></div>}
                  </button>
                )}
              </div>
            {!isWebcamOpen && (
              <div className="card card-deck"> {/* Adding Bootstrap class 'card-deck' */}
                <img src={`data:image/jpeg;base64,${imageResult}`} alt="No Result Image uploaded" className="card-img" /> {/* Adding Bootstrap class 'card-img-top' */}
                <div className="card-body">
                  <button className="card-button btn btn-secondary">Save and choose next ML Service</button>
                  <button onClick={download_item} className="card-button btn btn-primary">Download Output</button>  {/* Adding Bootstrap classes 'btn' and 'btn-primary' */}
                  <p>Backend Time: {backendTime} seconds</p>
                  <p>Preprocess Time: {preprocessTime} ms</p>
                  <p>Inference Time: {inferenceTime} ms</p>
                  <p>Postprocess Time: {postprocessTime} ms</p>
                  <p>Total Time: {preprocessTime+inferenceTime+postprocessTime} ms</p>
                </div>
              </div>
              
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KIDienste;
