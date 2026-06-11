import React, {useState, useRef, useEffect} from 'react'
import "../styles/videoMeet.css";
import io from "socket.io-client";
import { Button, TextField } from '@mui/material';

const serverUrl = "http://localhost:5000";

var connections = {};

const peerConfigConnecctions = {
    "iceServers": [
        {
            "urls": "stun:stun.l.google.com:19302"
        }
    ]
}

export default function VideoMeet() {

    var socketRef = useRef();
    let SocketIdRef = useRef();

    let localVideoRef = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);
    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState();
    let [audio, setAudio] = useState();

    let [screen, setScreen] = useState();

    let [showModal, setShowModal] = useState();

    let [screenAvailable, setScreenAvailable] = useState();

    let [message, setMessage] = useState([]);

    let [newmessage, setNewMessage] = useState(0);

    let [askForUsername, setAskForUsername] = useState(true);

    let [username, setUsername] = useState();

    const videoRef = useRef();

    let [videosrc, setVideosrc] = useState([]);

    //todo
    // if (isChrome() === false) {

    const getPermissions = async () => {
        try{
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
        
            if(videoPermission) {
            setVideoAvailable(true);
            } else {
            setVideoAvailable(false);
            }


            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
        
            if(audioPermission) {
            setAudioAvailable(true);
            } else {
            setAudioAvailable(false);
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false);
            }

            if(videoAvailable || audioAvailable) {

                
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video : videoAvailable, audio : audioAvailable });
            
                if(userMediaStream) {
                    window.localStream = userMediaStream;
                    if(localVideoRef.current) {
                        localVideoRef.current.srcObject = userMediaStream;
                    }
                }
            
            }
        }
        catch(error) {
            console.error('Error occurred while fetching media permissions:', error);
        }
        }
    

    useEffect(() => {
        getPermissions();
    }, []);

    let getUserMediaSuccess = (stream) => {

    }

    let getUserMedia = () => {
        if (video && videoAvailable || audio && audioAvailable) {
            navigator.mediaDevices.getUserMedia({ video : video, audio : audio })
            .then((stream) => {getUserMediaSuccess}) 
            .then((stream) => {})
            .catch((e) => console.log(e));
        } else {
            try {
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach((track) => track.stop());
            } catch (error) { }
        }
    }

    useEffect(() => {
        if (video !== undefined || audio !== undefined) {
            getUserMedia();
        }
    }, [video, audio]);


    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocket();
    }
  return (
    <div>
        {askForUsername === true ? 
        <div> 

            <h2>Enter into lobby</h2>
            <TextField id="outlined-basic" label="Username" value={username}  onChange={e => setUsername(e.target.value)} variant="outlined"/>
            <Button variant="contained" onClick={connectToSocket}>Connect</Button>

            <div>
                <video ref={localVideoRef} autoPlay muted></video>
            </div>
        </div> : <div>
        </div>
        }
    </div>
  )
}
