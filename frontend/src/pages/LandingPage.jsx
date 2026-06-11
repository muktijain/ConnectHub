import React from 'react'
import { Link } from 'react-router-dom';
import '../App.css';

export default function LandingPage() {
  return (
    <div className='landingPageContainer'>
      <nav>
        <div className= 'navHeader'>
          {/* <img src="/connectHub.png" alt="ConnectHub Logo"/> */}
          <h2>ConnectHub</h2>
        </div>
        <div className="navlist">
          <p>Join as Guest</p>
          <p>Register</p>
          <div role="button"><p>Login</p></div>
        </div>
      </nav>

      <div className="landingMainContainer">
        <div>
          <h1><span style={{ color: 'orange' }}>Connect</span> with your loved ones</h1>
          <p>Share moments and stay connected with your loved ones.</p>
          <div role="button" >
            <Link to="/auth">Get Started</Link>
          </div>
        </div>
        <div>
          <img src="/mobile-img.png" alt="Landing"/>
        </div>
      </div>


    </div>
  )
}
