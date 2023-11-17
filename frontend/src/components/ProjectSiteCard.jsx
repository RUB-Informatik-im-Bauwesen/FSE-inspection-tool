import React, { useState, useEffect } from 'react';
import './ProjectSiteCardStyle.css';
import axios from "axios"
import Button from 'react-bootstrap/Button';

const ProjectSiteCard = ({id, access_token, data, type, setModelTrainingID }) => {
  const [isChecked, setIsChecked] = useState(false);
  const [imageID, setImageID] = useState("")
  const [modelID, setModelID] = useState("")
  const [annotationID, setAnnotationID] = useState("")
  const [alreadyModel, setAlreadyModel] = useState(false)
  let imageSrc;
  let image_name;
  let dataNew;

  useEffect(() => {
    if(type === "images"){
      const url = `http://127.0.0.1:8000/get_images_by_project/${id}`
      axios.get(url, {
        headers: { Authorization: `Bearer ${access_token}` },
        }).then((res) => {
          if (res.data && res.data.length > 0){
            dataNew = res.data.find((item) => item._id === data._id);
            if (dataNew) {
              setIsChecked(dataNew.selected);
              setImageID(dataNew._id)
            }
            }
          }
        )
    } else if (type === 'annotations') {
      const url = `http://127.0.0.1:8000/get_annotations_by_project/${id}`
      axios.get(url, {
        headers: { Authorization: `Bearer ${access_token}` },
        }).then((res) => {
          if (res.data && res.data.length > 0){
            dataNew = res.data.find((item) => item._id === data._id);
            if (dataNew) {
              setAnnotationID(dataNew._id)
            }
            }
          }
        )
    } else if (type === 'models') {
      const url = `http://127.0.0.1:8000/get_models_by_project/${id}`
      axios.get(url, {
        headers: { Authorization: `Bearer ${access_token}` },
        }).then((res) => {
          if (res.data && res.data.length > 0){
            dataNew = res.data.find((item) => item._id === data._id);
            const hasSelectedModel = res.data.some((item) => item.selected === true);
            setAlreadyModel(hasSelectedModel)
            if (dataNew) {
              setIsChecked(dataNew.selected);
              setModelID(dataNew._id)
            }
            }
          }
        )
    }
  },[data])

  // Determine the image source based on the type
  if (type === 'images') {
    imageSrc = "/" + data.name;
  } else if (type === 'annotations') {
    imageSrc = '/txt.png'; // Replace with the actual image path for annotations
  } else if (type === 'models') {
    imageSrc = '/model.png'; // Replace with the actual image path for models
  } else if(type ==='demo'){
    imageSrc = data
    const filename = data.split("/").pop();
    data = {data:data, name:filename}
  }

  const handleCheckboxChange = () => {
    setIsChecked(!isChecked);
    update_image()
  };

  const handleCheckboxChangeModel = () => {
    setIsChecked(!isChecked)
    update_model()
    setModelTrainingID(modelID)
  }

  const update_image = () => {
    const url = `http://127.0.0.1:8000/update_image/${imageID}`
    axios.patch(url,{selected: !isChecked}, {
      headers: { Authorization: `Bearer ${access_token}` },
      }).then((res) => {
        }
      ).catch((err) => {
        console.log(err)
      })
  }

  const update_model = () => {
    const url = `http://127.0.0.1:8000/update_model/${modelID}`
    axios.patch(url,{selected: !isChecked}, {
      headers: { Authorization: `Bearer ${access_token}` },
      }).then((res) => {
        }
      ).catch((err) => {
        console.log(err)
      })
  }

  const delete_item = (type) => {
    let url;
    switch(type){
      case "images":
        url = `http://127.0.0.1:8000/delete_image/${imageID}`;
        break;
      case "annotations":
        url = `http://127.0.0.1:8000/delete_annotation/${annotationID}`
        break;
      case "models":
        url = `http://127.0.0.1:8000/delete_model/${modelID}`;
        break;
    }
    axios.delete(url,{
      headers: { Authorization: `Bearer ${access_token}` },
      }).then((res) => {
        }
      ).catch((err) => {
        console.log(err)
      })
  }

  const download_item = (type) => {
    let url;
    let dataSource;
    switch(type){
      case "images":
        url = `http://127.0.0.1:8000/download_image_new/${imageID}`;
        break;
      case "demo":
        url = `http://127.0.0.1:8000/download_predicted_image/`;
        dataSource = {path: imageSrc}
        break;
      case "annotations":
        url = `http://127.0.0.1:8000/download_annotation_new/${annotationID}`;
        break;
      case "models":
        url = `http://127.0.0.1:8000/download_model_new/${modelID}`;
        break;
    }
    console.log(url)
    const axiosConfig = {
      headers: { Authorization: `Bearer ${access_token}` },
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
          if (type === 'images') {
            a.download = `image.${res.headers['content-type'].split('/')[1]}`;
          } else if (type === 'annotations') {
            a.download = `annotation.txt`;
          } else if (type === 'models') {
            a.download = `model.pt`;
          } else if (type == "demo"){
            a.download = `image.${res.headers['content-type'].split('/')[1]}`;
          }

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

  return (
    <div className={`project-site-card ${type !== 'images' ? 'with-trash-icon' : ''} ${isChecked ? 'checked' : ''}`}>
      <div className="icons-container">
        <span className="trash-icon">
        <Button onClick={() =>{
           const confirmBox = window.confirm(`Do you really want to delete this item?`)
           if(confirmBox === true){
            delete_item(type)
           }}} className='trash-icon' variant="secondary">
          <i className="fas fa-trash" />
        </Button>
        </span>
        <span className="download-icon">
          <Button onClick={() => {
            download_item(type)
          }} className='download-icon' variant='secondary'>
            <i className="fas fa-download" />
          </Button>
        </span>
        {type === 'images'  && (
          <input type="checkbox" className="checkbox" checked={isChecked} onChange={handleCheckboxChange} />
        )}
        {type === 'models' && (
          <input type="checkbox" className="checkbox" checked={isChecked} onChange={handleCheckboxChangeModel} />
        )}
      </div>
      <img src={imageSrc} alt={data.name} />
      <div className="card-text"><a href="#">{data.name}</a></div>
      {type === 'images' && (
        <p>Rank: {data.ranking}</p>
      )}
    </div>
  );
};

export default ProjectSiteCard;
