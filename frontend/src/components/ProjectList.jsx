import React, { useState, useEffect } from 'react'
import Project from './Project'
import axios from 'axios'
import "bootstrap/dist/css/bootstrap.min.css"
import "./ProjectListStyle.css";

const ProjectList = ({projects, accessToken}) => {
  return (
    <div className='projectListContainer'>
      <h1 className="title">Projects</h1> {/* Added title */}
      <div className='projectsContainer'>
        <div className='projectsWrapper'>
          {projects.map((item, index) => {
            return (
              <Project
                key={index}
                name={item.name}
                description={item.description}
                image=""
                imageCount=""
                modelCount=""
                _id = {item._id}
                accessToken = {accessToken}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
export default ProjectList