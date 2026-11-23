import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import LandingPage from './pages/LandingPage';
import Authentication from './pages/Authentication';
import VideoMeet from './pages/videoMeet';
import Home from './pages/Home';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
   <>
   <Router>

    <AuthProvider>

        <Routes>
          <Route path='/' element={<LandingPage/>}/>
          <Route path='/auth' element={<Authentication/>}/>
          <Route path='/home' element={<Home/>}/>
          <Route path='/:url' element={<VideoMeet/>}/>
        </Routes>

    </AuthProvider>

   </Router>
   </>
  );
}

export default App;
