import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Navbar from './components/Navbar'
import { BrowserRouter, Routes, Route } from "react-router-dom"
import Login from "./components/Login"
import ProjectList from './components/ProjectList'

function App() {

  const[isLoggedIn, SetIsLoggedIn] = useState(false);
  const[accessToken, SetAcessToken] = useState("");
  const[userName, SetUsername] = useState("")
  const[projects, SetProjects] = useState([])

  useEffect(() => {
    // Check if user is already logged in from localStorage
    const username = window.localStorage.getItem("Username")
    SetUsername(username)
    const loggedInStatus = window.localStorage.getItem('isLoggedIn');
    if (loggedInStatus === 'true') {
      SetIsLoggedIn(true);
    } else{
      SetIsLoggedIn(false);
    }
    SetAcessToken(window.localStorage.getItem("Access_token"));
    if (window.localStorage.getItem("Projects")){
      SetProjects(JSON.parse(window.localStorage.getItem("Projects")))
    }
  }, []);

  const handleUsername = (username) => {
    SetUsername(username)
    window.localStorage.setItem("Username",username)
  }


  const handleLogout = () => {
    // Clear login status from localStorage
    window.localStorage.setItem('isLoggedIn', 'false');
    SetIsLoggedIn(false);
    SetUsername("")
    window.localStorage.setItem("Username","")
  }

  const setLogin = () => {
    // Set login status in localStorage
    window.localStorage.setItem('isLoggedIn', 'true');
    SetIsLoggedIn(true);
  }

  const setToken = (accessToken) => {
    SetAcessToken(accessToken)
    window.localStorage.setItem("Access_token",accessToken)
  }

  const setProject = (projects) => {
    SetProjects(projects)
    console.log("hey")
    console.log(projects)
    window.localStorage.setItem("Projects",JSON.stringify(projects))
  }



  return (
    <BrowserRouter>
      <div className='App'>
        <Navbar username = {userName} accessToken={accessToken} isLoggedIn={isLoggedIn} onLogout={handleLogout} setProjects = {setProject}></Navbar>
        <Routes>
          <Route path="/" element={<Login setUsername={handleUsername} setToken={setToken} login={setLogin} isLoggedIn={isLoggedIn} />}/>
          <Route path="/Projects" element={<ProjectList projects = {projects} accessToken={accessToken}/>}/>
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
