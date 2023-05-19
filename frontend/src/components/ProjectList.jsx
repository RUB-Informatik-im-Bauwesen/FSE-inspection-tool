import React, { useState, useEffect } from 'react'
import Project from './Project'
import axios from 'axios'
import "bootstrap/dist/css/bootstrap.min.css"
import "./ProjectListStyle.css";

const ProjectList = ({projects, accessToken}) => {
  return (
    <div className='projectListContainer'>
      <div className="topRightContainer">
      <h1 className="title">Projects</h1> {/* Added title */}
        <input
          type="text"
          placeholder="Search..."
        />
        <button className="addButton">Add</button>

      </div>
        <div className='projectsWrapper'>
          <div className='consider_grid'>
          {projects.map((item, index) => {
            return (
              <Project
                key={index}
                name={item.name}
                description={item.description}
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