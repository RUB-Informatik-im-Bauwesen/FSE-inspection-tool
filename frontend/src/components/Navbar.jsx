import React, { useState } from 'react'
import "./NavbarStyles.css"
import img from '/fire_extinguisher.png'
import axios from 'axios'

const Navbar = ({ username, accessToken, isLoggedIn, onLogout, setProjects }) => {

  const [clicked, SetClicked] = useState(false)
  const [loggedIn, SetLoggedIn] = useState(false)
  const [projects, SetProject] = useState([])
  const [activeLink, setActiveLink] = useState(""); // Initialize with an empty string


  const handleClick = () => {
    SetClicked(!clicked)
  }

  const get_projects_by_user2 = () => {

    axios
      .get("http://localhost:8000/get_all_projects_by_user", { //THESE LOCALHOSTS DONT WORK WITH CLOUD PROVIDERS
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((res) => {
        SetProject(res.data)
        setProjects(res.data)
      }).catch((err) => {
        console.log(err)
      });
    setTimeout(() => {
      window.location.replace("http://localhost:5173/Statistics")
    }, 500)
  }

  const get_projects_by_user = () => {

    axios
      .get("http://localhost:8000/get_all_projects_by_user", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((res) => {
        SetProject(res.data)
        setProjects(res.data)
      }).catch((err) => {
        console.log(err)
      });
    setTimeout(() => {
      window.location.replace("http://localhost:5173/Projects")
    }, 500)
  }

  return (
    <nav>

      <a href='/Projects'>
        <img src={img} />

      </a>
      <h1>FSE Inspection Tool</h1>

      <div className={isLoggedIn ? "display-on" : "display-off"}>
        <ul id="navbar" className={clicked ? "#navbar active" : "#navbar"}>
          <li><a href='/KIDienst'>FSE Services</a></li>
          <li><a onClick={get_projects_by_user}>ML-Models</a></li>
          <li><a onClick={get_projects_by_user2}>Evaluation</a></li>
          <li><a href='/FAQ'>FAQ</a></li>
          {/* 
          <li><a href='/ifc-viewer'>IFC Viewer</a></li>

          <li><a href='/chat'>Chat</a></li>
          */}
          <li><a onClick={onLogout} href='/'>Logout</a></li>
          
        </ul>
      </div>

      <div className={isLoggedIn ? "display-off" : "display-on"}>
        <ul id="navbar" className={clicked ? "#navbar active" : "#navbar"}>
          <li><a href='/'>Login</a></li>
          <li><a href='/FAQ'>FAQ</a></li>
        </ul>
      </div>

      <div id='mobile'>
        <i id='bar' className={clicked ? 'fas fa-times' : 'fas fa-bars'} onClick={handleClick}></i>
      </div>

    </nav>
  )
}

export default Navbar