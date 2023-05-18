import React, {useState} from 'react'
import "./ProjectStyle.css"
import axios from 'axios'

const Project = ({key, name, description, image, imageCount, modelCount, _id, accessToken} ) => {
  const [image_path, SetImagePath] = useState("")

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
            final_path = "/" + data.name + ".jpg"
            SetImagePath(final_path)
          }
        }
      )
    console.log(image_path)
    return image_path
  }

  return (
    <div key={key} className='projects'>
      <img src={get_images_of_project(accessToken,_id) ? get_images_of_project(accessToken,_id) : "/noimage.png"} className='projectImage'/>
      <div className='description'>
        <a href='/Projects'>{name}</a>
        <p>{description}</p>
        <p>Images: {imageCount}</p>
        <p>Models: {modelCount}</p>
      </div>
    </div>
  )
}

export default Project