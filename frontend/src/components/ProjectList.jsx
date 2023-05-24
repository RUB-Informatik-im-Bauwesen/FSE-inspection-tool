import React, { useState, useEffect } from 'react'
import Project from './Project'
import Popup from './Popup'
import axios from 'axios'
import "bootstrap/dist/css/bootstrap.min.css"
import "./ProjectListStyle.css";

const ProjectList = ({setProject ,projects, accessToken}) => {
  const [showPopup, setShowPopup] = useState(false);
  const [showFiltered, setShowFiltered] = useState(false)
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    /*axios.get("http://127.0.0.1:8000/get_all_projects_by_user", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((res) => {
        setProject(res.data)
      }).catch((err) => {
      });*/
  },[])


  const handleTogglePopup = () => {
    setShowPopup(!showPopup);
  };

  const handleSearchChange = (event) => {
    if(!event.target.value){
      setShowFiltered(false)
    }else{
      setShowFiltered(true)
    }
    setSearchTerm(event.target.value);
  };


  const filteredProjects = projects.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
    <div className='projectListContainer'>
      <Popup show={showPopup} access_token={accessToken} handleTogglePopup={handleTogglePopup} />
      <div className="topRightContainer">
      <h1 className="title">Projects</h1> {/* Added title */}
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <button onClick={handleTogglePopup} className="addButton">Add</button>
      </div>
        <div className='projectsWrapper'>
          <div className='consider_grid'>
          {showFiltered ? filteredProjects.map((item, index) => (
            <Project
              key={index}
              name={item.name}
              description={item.description}
              _id = {item._id}
              accessToken = {accessToken}
            />
          )) : projects.length > 0 ? projects.map((item, index) => {
            return (
              <Project
                key={index}
                name={item.name}
                description={item.description}
                _id = {item._id}
                accessToken = {accessToken}
              />
            );
          }) : "" }
          </div>
        </div>

    </div>
  );
}
export default ProjectList