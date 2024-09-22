import React, { useState, useEffect } from 'react';
import './KIDiensteStyle.css';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import axios from 'axios';
import Dropdown from 'react-bootstrap/Dropdown';


const KIDienste = ({ accessToken }) => {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [files, setFiles] = useState(null);
  const [imageUpload, setImageUpload] = useState("");
  const [imageResult, setImageResult] = useState("");
  const [selectedMLService, setSelectedMLService] = useState(null);
  const [isLoadingPredict, setLoadingPredict] = useState(false);


  const download_item = () => {

    if(!imageResult){
      return
    }

    let dataSource;
    const createurl = new URL(imageResult, window.location.href);
    const fileNameWithExtension = createurl.pathname.split('/').pop();

    let url = `http://127.0.0.1:8000/download_image_json/${fileNameWithExtension}`;

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
      formData.append('file', files[0]);
      let url = `http://127.0.0.1:8000/upload_image_KI_Dienste`;
      axios.post(url, formData, {
              headers: {  Authorization: `Bearer ${accessToken}`, 'Content-Type': files.type }
            })
            .then((res) => {
              setImageUpload(files[0].name)
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

    const url = `http://127.0.0.1:8000/predict_image_KI_Dienste/${selectedMLService}/${fileNameWithoutExtension}`
      axios
      .get(url, {
        headers: {  Authorization: `Bearer ${accessToken}`},
            })
        .then((res) => {
          setImageResult(res.data)
          setLoadingPredict(false)
          console.log(res.data)
        })
        .catch((err) => {
            console.log(err);
        });

  }
  const navigateToViewJsons = () => {
    window.location.replace("http://127.0.0.1:5173/view-jsons");
  };

  return (


    <div className="visual-fire-inspection-tool-container">
          <Modal
        show={isModalOpen}
      >
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
          <Button variant="danger"  onClick={()=> handleSubmitUpload()}>
            Submit
          </Button>
        </Modal.Footer>
      </Modal>

      <div className="title-text-container">
        <h1 >Visual Fire Inspection Tool</h1>
        <p >Welcome to Visual Fire Inspection Tool! What can I inspect for you? 😃</p>
      </div>

      <div className="top-right-button">
        <button onClick={navigateToViewJsons} className="btn btn-primary">View all inspections</button>
      </div>

      <div className="card-container">
        <div className="card" > {/* Adding Bootstrap class 'card-deck' */}
          <img src={imageUpload} alt="No Image Uploaded" className="card-img" /> {/* Adding Bootstrap class 'card-img-top' */}
          <div className="card-body">
            <button onClick={openModal} className="card-button btn btn-secondary">Upload Image</button>
            <button className="card-button btn btn-secondary">Create Image</button>  {/* Adding Bootstrap classes 'btn' and 'btn-primary' */}
          </div>
        </div>

        {/* Buttons placed between the cards */}
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
            {/* Add more Dropdown.Items as needed */}
            </Dropdown.Menu>
        </Dropdown>
          <button onClick={predict_image} className="bottom-button btn btn-primary">Start! {isLoadingPredict && <div className="loading-circle"></div>} </button> {/* Adding Bootstrap classes 'btn' and 'btn-danger' */}
        </div>

        <div className="card card-deck"> {/* Adding Bootstrap class 'card-deck' */}
          <img src={imageResult} alt="No Result Image uploaded" className="card-img" /> {/* Adding Bootstrap class 'card-img-top' */}
          <div className="card-body">
            <button className="card-button btn btn-secondary">Save and choose next ML Service</button>
            <button onClick={download_item} className="card-button btn btn-primary">Download Output</button>  {/* Adding Bootstrap classes 'btn' and 'btn-primary' */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KIDienste;
