import React, { useState, useEffect } from 'react';
import './ProjectSiteCardStyle.css';
import axios from "axios"
import Button from 'react-bootstrap/Button';

const ProjectSiteCard = ({id, access_token, data, type }) => {
  const [isChecked, setIsChecked] = useState(false);
  const [imageID, setImageID] = useState("")
  const [modelID, setModelID] = useState("")
  const [annotationID, setAnnotationID] = useState("")
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
            if (dataNew) {
              setModelID(dataNew._id)
            }
            }
          }
        )
    }
  },[])

  // Determine the image source based on the type
  if (type === 'images') {
    imageSrc = "/" + data.name;
  } else if (type === 'annotations') {
    imageSrc = '/txt.png'; // Replace with the actual image path for annotations
  } else if (type === 'models') {
    imageSrc = '/model.png'; // Replace with the actual image path for models
  }

  const handleCheckboxChange = () => {
    setIsChecked(!isChecked);
    update_image()
  };

  const handleCheckboxChangeModel = () => {
    setIsChecked(!isChecked)
    update_model()
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

  return (
    <div className={`project-site-card ${type !== 'images' ? 'with-trash-icon' : ''} ${isChecked ? 'checked' : ''}`}>
      <div className="icons-container">
        <span className="trash-icon">
        <Button onClick={() =>{
           const confirmBox = window.confirm(`Do you really want to delete this item${name}?`)
           if(confirmBox === true){
            delete_item(type)
           }}} className='trash-icon' variant="secondary">
          <i className="fas fa-trash" />
        </Button>
        </span>
        {type === 'images'  && (
          <input type="checkbox" className="checkbox" checked={isChecked} onChange={handleCheckboxChange} />
        )}
        {type === 'models'  && (
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
