import React, {useState, useRef, useEffect} from 'react'
import styles from "../styles/videoMeet.module.css";
import io from "socket.io-client";
import { Button, IconButton, TextField } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon  from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import { Badge } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import SendIcon from '@mui/icons-material/Send';
import { useNavigate } from 'react-router-dom';

const serverUrl = "http://localhost:5000";

// const serverUrl = "https://192.168.31.183:5000";

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
    let socketIdRef = useRef();

    let localVideoRef = useRef();
    const showModalRef = useRef(true);

    let [videoAvailable, setVideoAvailable] = useState(true);
    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState(undefined);
    let [audio, setAudio] = useState();

    let [screen, setScreen] = useState();

    let [showModal, setShowModal] = useState(true);

    let [screenAvailable, setScreenAvailable] = useState(false);

    let [messages, setMessages] = useState([]);

    let [message, setMessage] = useState("");

    let [newmessage, setNewMessage] = useState(0);

    let [askForUsername, setAskForUsername] = useState(true);

    let [username, setUsername] = useState();

    const videoRef = useRef([]);

    let [videos, setVideos] = useState([]);

    let routeTo = useNavigate();

    const getPermissions = async () => {
        setScreenAvailable(!!navigator.mediaDevices?.getDisplayMedia);
            try {
        const v = await navigator.mediaDevices.getUserMedia({ video: true });
        v.getTracks().forEach(t => t.stop());   // release it right away
        setVideoAvailable(true);
    } catch (e) {
        setVideoAvailable(false);
    }
        // try{
        //     const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
        
        //     if(videoPermission) {
        //     setVideoAvailable(true);
        //     } else {
        //     setVideoAvailable(false);
        //     }


            // const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
        
            // if(audioPermission) {
            // setAudioAvailable(true);
            // } else {
            // setAudioAvailable(false);
            // }

          try {
                const a = await navigator.mediaDevices.getUserMedia({ audio: true });
                a.getTracks().forEach(t => t.stop());
                setAudioAvailable(true);
            } catch (e) {
                setAudioAvailable(false);
            }
           try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        window.localStream = stream;
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }
    }  catch(error) {
                console.error('Error occurred while fetching media permissions:', error);
            }
        };
    

    useEffect(() => {
        getPermissions();
    }, []);



    const connect = () => { setAskForUsername(false); getMedia(); }


    let getUserMediaSuccess = (stream) => {
        try { window.localStream.getTracks().forEach(t => t.stop()); } catch (e) { console.log(e); }

        // if camera or mic is off, fill the gap so the peer's old frame doesn't freeze
        const tracks = [...stream.getTracks()];
        if (stream.getVideoTracks().length === 0) tracks.push(black());
        if (stream.getAudioTracks().length === 0) tracks.push(silence());
        const finalStream = new MediaStream(tracks);

        window.localStream = finalStream;
        localVideoRef.current.srcObject = finalStream;
        replaceTrackForPeers(finalStream);
    };

    let silence = () => {
        let ctx = new AudioContext();
        let oscillator = ctx.createOscillator()

        let dst = oscillator.connect(ctx.createMediaStreamDestination());

        oscillator.start();
        ctx.resume();
        return Object.assign(dst.stream.getAudioTracks()[0], {enabled: false});
    }

    let black = ({width = 640, height = 480} = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), {width, height});
        canvas.getContext("2d").fillRect(0, 0, width, height);
        let stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], {enabled: false});
    }


    const replaceTrackForPeers = (stream) => {
        for (let id in connections) {
            if (id === socketIdRef.current) continue;

            const senders = connections[id].getSenders();
            stream.getTracks().forEach(newTrack => {
                const sender = senders.find(s => s.track && s.track.kind === newTrack.kind);
                if (sender) {
                    sender.replaceTrack(newTrack);
                } else {
                    connections[id].addTrack(newTrack, stream);
                }
            });
        }
    };

    let getUserMedia = () => {
        if (video && videoAvailable || audio && audioAvailable) {
            navigator.mediaDevices.getUserMedia({ video : video, audio : audio })
            .then((stream) => getUserMediaSuccess(stream)) 
            .then((stream) => {})
            .catch((e) => console.log(e));
        } else {
            try { window.localStream.getTracks().forEach(t => t.stop()); } catch (e) {}
                const blackSilence = new MediaStream([black(), silence()]);
                window.localStream = blackSilence;
                localVideoRef.current.srcObject = blackSilence;
                replaceTrackForPeers(blackSilence);
        }
    }

    
    // let getDisplayMediaSuccess = (stream) => {
    //     console.log("HERE")
    //     try {
    //         window.localStream.getTracks().forEach(track => track.stop())
    //     } catch (e) { console.log(e) }

    //     window.localStream = stream
    //     localVideoRef.current.srcObject = stream
    //     replaceTrackForPeers(stream)
        
    //     for (let id in connections) {
    //         if (id === socketIdRef.current) continue

    //         // connections[id].addStream(window.localStream)
    //         window.localStream.getTracks().forEach(track => {
    //             connections[id].addTrack(track, window.localStream);
    //         });


    //         connections[id].createOffer().then((description) => {
    //             connections[id].setLocalDescription(description)
    //                 .then(() => {
    //                     socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
    //                 })
    //                 .catch(e => console.log(e))
    //         })
    //     }

    //     stream.getTracks().forEach(track => track.onended = () => {
    //         setScreen(false)

    //         try {
    //             let tracks = localVideoRef.current.srcObject.getTracks()
    //             tracks.forEach(track => track.stop())
    //         } catch (e) { console.log(e) }

    //         let blackSilence = (...args) => new MediaStream([black(...args), silence()])
    //         window.localStream = blackSilence()
    //         localVideoRef.current.srcObject = window.localStream

    //         getUserMedia()

    //     })
    // }
    let getDisplayMediaSuccess = (stream) => {
        try { window.localStream.getTracks().forEach(t => t.stop()); } catch (e) {}

        window.localStream = stream;
        localVideoRef.current.srcObject = stream;
        replaceTrackForPeers(stream);

        // browser's "Stop sharing" bar
        stream.getVideoTracks()[0].onended = () => setScreen(false);
    };

    let stopScreenShare = async () => {
    try { window.localStream.getTracks().forEach(t => t.stop()); } catch (e) {}

    try {
         const camStream = (video || audio)
            ? await navigator.mediaDevices.getUserMedia({ video, audio })
            : new MediaStream();

        const tracks = [...camStream.getTracks()];
        if (camStream.getVideoTracks().length === 0) tracks.push(black());
        if (camStream.getAudioTracks().length === 0) tracks.push(silence());
        const finalStream = new MediaStream(tracks);
        window.localStream = finalStream;
        localVideoRef.current.srcObject = finalStream;
        replaceTrackForPeers(finalStream);
    } catch (e) {
        // no camera: send black + silence
        const blackSilence = new MediaStream([black(), silence()]);
        window.localStream = blackSilence;
        localVideoRef.current.srcObject = blackSilence;
        replaceTrackForPeers(blackSilence);
    }
};



    useEffect(() => {
         if (screen) return; 
        if (video !== undefined || audio !== undefined) {
            getUserMedia();
        }
    }, [video, audio]);



    const gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message);
        if(fromId !== socketIdRef.current) {
            if(signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if(signal.sdp.type === "offer") {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit("signal", fromId, JSON.stringify({"sdp": connections[fromId].localDescription}));
                            })
                            .catch(e => console.log(e ));
                        });
                       
                    }

                });
            }
            if(signal.ice){
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e));
            }
        }
    }

    const connectToSocket = () => {
        socketRef.current = io.connect(serverUrl, {secure: false});
        socketRef.current.on("signal", gotMessageFromServer);
        socketRef.current.on("chat-message", addMessage);
        socketRef.current.on('connect', () => {

        socketRef.current.emit("join_call", window.location.href);
        socketIdRef.current = socketRef.current.id;

        socketRef.current.on("user-left", (id) => {
             setVideos((videos) => videos.filter((video) => video.socketId !== id));
        });

            socketRef.current.on("user-joined", (id, clients) => {


                clients.forEach((socketListId) => {

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnecctions);
                    
                    //protocol for exchanging ICE candidates between clients to establish a peer-to-peer connection
                    connections[socketListId].onicecandidate = function (event) {  
                        if(event.candidate !== null) {
                            socketRef.current.emit("signal", socketListId, JSON.stringify({"ice": event.candidate}));
                        }
                    }

                    // connections[socketListId].onaddstream =  (event) => {
                       
                    //     console.log("BEFORE:", videoRef.current);
                    //     console.log("FINDING ID: ", socketListId);

                    //     let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                    //     if(videoExists) {
                    //         console.log("FOUND EXISTING");

                    //         setVideos(videos => {
                    //             const updateVideos = videos.map(video => 
                    //                 video.socketId === socketListId ? { ...video, stream: event.stream } : video
                    //             );
                    //             videoRef.current = updateVideos;
                    //             return updateVideos;
                    //         });
                    //     } else {
                    //         console.log("CREATING NEW");

                    //         let newVideo = {socketId: socketListId, stream: event.stream, autoPlay: true, playsInline: true};
                    //         setVideos(videos => {
                    //             const updatedVideos = [...videos, newVideo];
                    //             videoRef.current = updatedVideos;
                    //             return updatedVideos;
                    //         });
                    //     }
                    // };

                    connections[socketListId].ontrack = (event) => {
    let videoExists = videoRef.current.find(video => video.socketId === socketListId);

    if (videoExists) {
        setVideos(videos => {
            const updateVideos = videos.map(video =>
                video.socketId === socketListId ? { ...video, stream: event.streams[0] } : video
            );
            videoRef.current = updateVideos;
            return updateVideos;
        });
    } else {
        let newVideo = {
            socketId: socketListId,
            stream: event.streams[0],  // ← event.streams[0] not event.stream
            autoPlay: true,
            playsInline: true
        };
        setVideos(videos => {
            const updatedVideos = [...videos, newVideo];
            videoRef.current = updatedVideos;
            return updatedVideos;
        });
    }
}

                    if(window.localStream !== undefined && window.localStream !== null) {
                        // connections[socketListId].addStream(window.localStream);
                        window.localStream.getTracks().forEach(track => {
    connections[socketListId].addTrack(track, window.localStream);
});
                    } else {
                        console.log("CREATING LOCAL STREAM");
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                        window.localStream = blackSilence();
                        // connections[socketListId].addStream(window.localStream);
                        window.localStream.getTracks().forEach(track => {
    connections[socketListId].addTrack(track, window.localStream);
});

                    }
                });

                if (id === socketIdRef.current) {
                    for(let id2 in connections) {
                        if(id2 === socketIdRef.current) continue;

                        // try {
                        //     // connections[id2].addStream(window.localStream);
                        //     window.localStream.getTracks().forEach(track => {
                        //         connections[id2].addTrack(track, window.localStream);
                        //     });
                        // } catch (e) {}
                            connections[id2].createOffer().then((description) => {
                                connections[id2].setLocalDescription(description).then(() => {
                                    socketRef.current.emit("signal", id2, JSON.stringify({"sdp": connections[id2].localDescription}));
                                })
                                .catch(e => console.log(e));
                            });
                        
                    }
                }
            });
        });
    };
    


    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocket();
    }

    let handleVideo = () => {
        setVideo(!video);
    }

    let handleAudio = () => {
        setAudio(!audio);
    }

    let handleScreen = () => {
        setScreen(!screen)
    }

    let sendMessage = () => {
        socketRef.current.emit("chat-message", message, username);
        setMessage("");
    }
    let addMessage = (sender, data, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            {sender: sender,data: data}
        ]);

        if(socketIdSender !== socketIdRef.current && !showModalRef.current) { 
            setNewMessage((prevCount) => prevCount + 1);
        }
    }
    let handleEndCall = () => {
        try{
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
        } catch (e) {
            console.log(e);
        }
        routeTo("/home");
    };

  

    let getDisplayMedia = () => {
        if (screen) {
            if(navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true , audio: true })
                .then(getDisplayMediaSuccess)
                .then((stream) => {})
            .catch((e) => console.log(e));
            }
        }
    }

    useEffect(() => {
        if (screen == undefined) return;
        if (screen) {
            getDisplayMedia();
        } else{
            stopScreenShare();
        }
    }, [screen]);

    useEffect(() => {
        showModalRef.current = showModal;
        if (showModal) setNewMessage(0);   // clear the badge when chat opens
    }, [showModal]);

  return (
    <div>
        {askForUsername === true ? 
        <div> 

            <h2>Enter into lobby</h2>
            <TextField id="outlined-basic" label="Username" value={username}  onChange={e => setUsername(e.target.value)} variant="outlined"/>
            <Button variant="contained" onClick={connect}>Connect</Button>

            <div>
                <video ref={localVideoRef} autoPlay muted></video>
            </div>
        </div> :
         <div className={styles.meetVideoContainer}>
            {showModal ? <div className={styles.chatRoom}>
                <div className={styles.chatContainer}>
                    <h2 className={styles.chatTitle}>Chat</h2>
                    <hr/>
                    <div className={styles.chatingDisplay}>
                    {messages.length> 0 ? messages.map((item, index) => {
                        return (
                            <div key={index}>
                                <strong>{item.sender}: </strong>
                                <p>{item.data}</p>
                            </div>
                        )
                    }) : <p className={styles.noMessages}>No messages yet.</p>}
                    </div>

                    <div className={styles.chattingArea}>
                    <TextField value={message} onChange={e => setMessage(e.target.value)} fullWidth  id="fullWidth" placeholder="Type a message..." />
                    <IconButton onClick={sendMessage}>
                        <SendIcon/>
                    </IconButton>
                    </div>
                </div>

            </div> : <></>}

            <div className={styles.buttonContainer}>
               
                <IconButton style={{color: "white"}} onClick={handleVideo}>
                    {(video === true) ? <VideocamIcon /> : <VideocamOffIcon />}
                </IconButton>

                <IconButton style={{color: "red"}} onClick={handleEndCall}>
                   <CallEndIcon />
                </IconButton>

                <IconButton style={{color: "white"}} onClick={handleAudio}>
                    {(audio === true) ? <MicIcon/> : <MicOffIcon/>}
                </IconButton>

                {screenAvailable === true ?
                <IconButton style={{color: "white"}} onClick={handleScreen} >
                      {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                </IconButton> : <> </>}

                <Badge badgeContent={newmessage} max={999} color="error">
                    <IconButton onClick={() => setShowModal(!showModal)} style={{color: "white"}} >
                        <ChatIcon />
                    </IconButton>
                </Badge>

            </div>

            
            
            <video className={styles.meetUserVideo} ref={localVideoRef} autoPlay muted></video>
           <div className={styles.conferenceView}>
            {videos.map((video) => (
                <div key={video.socketId}>
                    {/* <h2>{video.socketId}</h2> */}

                    <video     
                    data-socket={video.socketId}
                    ref={ref => {
                        if (ref && video.stream) {
                            ref.srcObject = video.stream;
                        }
                    }}
                    autoPlay></video>
                </div>
            ))}
            </div>
        </div>
        }
    </div>
  )
}
