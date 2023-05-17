import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Navbar from './components/Navbar'
import { BrowserRouter, Routes, Route } from "react-router-dom"
import Login from "./components/Login"

function App() {

  const[isLoggedIn, SetIsLoggedIn] = useState(false);
  const[accessToken, SetAcessToken] = useState("");
  const[userName, SetUsername] = useState("")

  useEffect(() => {
    // Check if user is already logged in from localStorage
    const username = window.localStorage.getItem("Username")
    SetUsername(username)
    const loggedInStatus = window.localStorage.getItem('isLoggedIn');
    console.log(loggedInStatus)
    console.log("hello")
    if (loggedInStatus === 'true') {
      SetIsLoggedIn(true);
    } else{
      SetIsLoggedIn(false);
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
    if(isLoggedIn){
      SetAcessToken(accessToken)
    }
    else{
      SetAcessToken("")
    }
  }

  return (
      <div className='App'>
        <Navbar username = {userName} accessToken={accessToken} isLoggedIn={isLoggedIn} onLogout={handleLogout}></Navbar>
        <Login setUsername={handleUsername} setToken={setToken} login={setLogin} isLoggedIn={isLoggedIn}></Login>
      </div>
  )
}

export default App
