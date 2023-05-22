import React, {useState} from 'react'
import "./ProjectStyle.css"
import axios from 'axios'
import Button from 'react-bootstrap/Button';

const Project = ({key, name, description,_id, accessToken} ) => {
  const [image_path, SetImagePath] = useState("")
  const [image_length, SetImageLength] = useState(0)
  const [model_length, SetModelLength] = useState(0)

  const delete_project = (access_token, id) => {
    const url = `http://127.0.0.1:8000/delete_project/${id}`
    axios.delete(url,{
      headers: { Authorization: `Bearer ${access_token}` },
      })
  }


  const get_images_of_project = (access_token, id) => {
    let data = ""
    let image_paths = ""
    let final_path = ""
    const url = `http://127.0.0.1:8000/get_images_by_project/${id}`
    console.log(url)
    axios.get(url, {
      headers: { Authorization: `Bearer ${access_token}` },
      }).then((res) => {
        console.log(res.data)
        if (res.data && res.data.length > 0){
            data = res.data[0]
            image_paths = data.name
            final_path = "/" + data.name
            SetImagePath(final_path)
            SetImageLength(res.data.length)
          }
        }
      )
    console.log(image_path)
    return image_path
  }

  const get_model_count = (access_token, id) => {
    const url = `http://127.0.0.1:8000/get_models_by_project/${id}`
    axios.get(url, {
      headers: { Authorization: `Bearer ${access_token}` },
      }).then((res) => {
        if (res.data && res.data.length > 0){
            SetModelLength(res.data.length)
          }
        }
      )
      return model_length
    }

  return (
    <div key={key} className='projects'>
      <img src={get_images_of_project(accessToken,_id) ? get_images_of_project(accessToken,_id) : "/noimage.png"} className='projectImage'/>
      <div className='description'>
        <div className='title-container'>
          <a href={`/Projects/${_id}`} className='title'>{name}</a>
          <Button onClick={() =>{
           const confirmBox = window.confirm(`Do you really want to delete this project ${name}?`)
           if(confirmBox === true){
            delete_project(accessToken,_id)
           }}} className='trash-icon' variant="secondary">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"></path>
            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"></path>
          </svg>
          </Button>
        </div>
        <p>{description}</p>
        <p>Images: {image_length}</p>
        <p>Models: {get_model_count(accessToken,_id)}</p>
      </div>
    </div>
  )
}

export default Project