import React from 'react'
import "./NavbarStyles.css"
import img from './fire_extinguisher.png'
class Navbar extends React.Component{
  state={clicked: false}

  handleClick = () => {
    this.setState({clicked: !this.state.clicked})
  }

  render(){
    return (
      <nav>
        <a href='index.html'>
          <img src={img}/>

        </a>
        <h1>AL Application for TBE</h1>
        <div>
          <ul id="navbar" className={this.state.clicked ? "#navbar active" : "#navbar"}>
            <li><a className='active' href='index.html'>Home</a></li>
            <li><a href='index.html'>Projects</a></li>
            <li><a href='index.html'>Statistics</a></li>
            <li><a href='index.html'>FAQ</a></li>
          </ul>
        </div>

        <div id='mobile'>
          <i id='bar' className={this.state.clicked ? 'fas fa-times' : 'fas fa-bars'} onClick={this.handleClick}></i>
        </div>

      </nav>
    )
  }
}

export default Navbar