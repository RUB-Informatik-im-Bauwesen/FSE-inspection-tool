
import React, { useState, useRef } from "react"
import "bootstrap/dist/css/bootstrap.min.css"
import "./LoginStyle.css"
import axios from 'axios'

export default function (props) {
  const [authMode, setAuthMode] = useState("signin")
  const [loggedIn, setLoggedIn] = useState(false)
  const [loginError, setloginError] = useState(false);
  const [registerError, setregisterError] = useState(false);
  const [registerSuccess, setregisterSuccess] = useState(false);

  const userRef = useRef()
  const passwordRef = useRef()

  const changeAuthMode = () => {
    setAuthMode(authMode === "signin" ? "signup" : "signin")
  }

  const register = () => {
    axios.post("http://127.0.0.1:8000/register",{
        username: userRef.current.value,
        password: passwordRef.current.value
      }
    ).then((res) => {
      setregisterSuccess(true);
      setTimeout(() => {
        setregisterSuccess(false);
      }, 3000);
    }).catch((err) => {
      setregisterError(true);
      setTimeout(() => {
        setregisterError(false);
      }, 3000);
    })
  }

  const get_username = (access_token) => {
    axios.get("http://127.0.0.1:8000/get_user", {
      headers: { Authorization: `Bearer ${access_token}` },
      }).then((res) => {
        props.setUsername(res.data)
      })
  }

  const login = () => {
    let data = new FormData()
    data.append("username", userRef.current.value)
    data.append("password",passwordRef.current.value)

    axios.post("http://127.0.0.1:8000/login", data).then((res) => {
      setLoggedIn(true);
      props.login()
      props.setToken(res.data.access_token)
      get_username(res.data.access_token)
    }).catch((err) => {
      console.log(err);
      setloginError(true);
      setTimeout(() => {
        setloginError(false);
      }, 3000);
    })
  }

  if (authMode === "signin" && !props.isLoggedIn) {
    return (
      <div className="Auth-form-container">
        <form className="Auth-form">
          <div className="Auth-form-content">
            <h3 className="Auth-form-title">Sign In</h3>
            <div className="text-center">
              Not registered yet?{" "}
              <span className="link-primary" onClick={changeAuthMode}>
                Sign Up
              </span>
            </div>
            <div className="form-group mt-3">
              {loginError ? <p className="error">Login fehlgeschlagen</p> : ""}
              <label>Username</label>
              <input
                type="text"
                className="form-control mt-1"
                placeholder="Enter username"
                ref={userRef}
              />
            </div>
            <div className="form-group mt-3">
              <label>Password</label>
              <input
                type="password"
                className="form-control mt-1"
                placeholder="Enter password"
                ref={passwordRef}
              />
            </div>
            <div className="d-grid gap-2 mt-3">
              <button onClick={login} type="button" className="btn btn-primary">
                Submit
              </button>
            </div>
          </div>
        </form>
      </div>
    )
  }
  if(!props.isLoggedIn){
    return (
      <div className="Auth-form-container">
        <form className="Auth-form">
          <div className="Auth-form-content">
            <h3 className="Auth-form-title">Sign Up</h3>
            <div className="text-center">
              Already registered?{" "}
              <span className="link-primary" onClick={changeAuthMode}>
                Sign In
              </span>
            </div>
            <div className="form-group mt-3">
            {registerError ? <p className="error">User existiert bereits</p> : ""}
            {registerSuccess ? ( <p className="success">Registrierung erfolgreich!</p>) :("")}
            <label>Username</label>
                <input
                  type="text"
                  className="form-control mt-1"
                  placeholder="Enter username"
                  ref={userRef}
                />
            </div>
            <div className="form-group mt-3">
              <label>Password</label>
              <input
                type="password"
                className="form-control mt-1"
                placeholder="Enter Password"
                ref={passwordRef}
              />
            </div>
            <div className="d-grid gap-2 mt-3">
              <button onClick={register} type="button" className="btn btn-primary">
                Submit
              </button>
            </div>
          </div>
        </form>
      </div>
    )
  }

}
