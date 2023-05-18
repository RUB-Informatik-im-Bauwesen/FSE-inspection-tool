import React from 'react'

const Project = ({key, name, description, image, imageCount, modelCount} ) => {
  console.log("hey")
  return (

    <div className='projectItem'>
      <img src={image} />
      <div className='description'>
        <a href='index.html'>{name}</a>
        <p>{description}</p>
        <p>Images: {imageCount}</p>
        <p>Models: {modelCount}</p>
      </div>
    </div>
  )
}

export default Project