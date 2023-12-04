import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Navbar from './components/Navbar'
import { BrowserRouter, Routes, Route } from "react-router-dom"
import Login from "./components/Login"
import ProjectList from './components/ProjectList'
import ProjectSite from './components/ProjectSite'
import Statistics from './components/Statistics'
import StatisticsMultipleModels from './components/StatisticsMultipleModels'
import FAQ from './components/FAQ'
import KIDienste from './components/KIDienste'

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
    SetIsLoggedIn(false);
    SetUsername("")
    SetAcessToken("")
    SetProjects([])
    window.localStorage.setItem('isLoggedIn', 'false');
    window.localStorage.setItem("Username","")
    window.localStorage.setItem("Access_token","")
    window.localStorage.setItem("Projects","")
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
    window.localStorage.setItem("Projects",JSON.stringify(projects))
  }



  return (
    <BrowserRouter>
      <div className='App'>
        <Navbar username = {userName} accessToken={accessToken} isLoggedIn={isLoggedIn} onLogout={handleLogout} setProjects = {setProject}></Navbar>
        <Routes>
          <Route path="/" element={<Login setUsername={handleUsername} setToken={setToken} login={setLogin} isLoggedIn={isLoggedIn} />}/>
          <Route path="/Projects" element={<ProjectList setProject={setProject} projects = {projects} accessToken={accessToken}/>}/>
          <Route path="/Projects/:id" element={<ProjectSite accessToken={accessToken} />}/>
          <Route path="/Statistics" element={<StatisticsMultipleModels accessToken={accessToken} projects={projects}/>}/>
          <Route path="/KIDienst" element={<KIDienste accessToken={accessToken}/>}/>
          <Route path="/FAQ" element={<FAQ/>}/>
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
