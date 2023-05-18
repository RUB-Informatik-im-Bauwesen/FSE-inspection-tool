import React, { useState, useEffect } from 'react'
import Project from './Project'
import axios from 'axios'
import "bootstrap/dist/css/bootstrap.min.css"

const ProjectList = ({projects}) => {
  console.log(projects)

  return (

   <div>
      {projects.map((item, index) => {
       return(
        <Project
          key = {index}
          name = {item.name}
          description = {item.description}
          image = ""
          imageCount = ""
          modelCount = ""
        />
       );
      })}
   </div>
  )
}

export default ProjectList