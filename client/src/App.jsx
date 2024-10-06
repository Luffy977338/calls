import React, { useRef, useState } from "react";
import io from "socket.io-client";

const socket = io("https://919a-45-85-105-82.ngrok-free.app"); // Подключение к WebSocket серверу

function App() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);

  const servers = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(servers);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("candidate", event.candidate);
      }
    };

    pc.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

    setPeerConnection(pc);
  };

  const startCall = () => {
    createPeerConnection();

    peerConnection
      .createOffer()
      .then((offer) => {
        return peerConnection.setLocalDescription(offer);
      })
      .then(() => {
        socket.emit("offer", peerConnection.localDescription);
      });
  };

  const handleAnswer = (answer) => {
    peerConnection.setRemoteDescription(answer);
  };

  const handleOffer = (offer) => {
    createPeerConnection();

    peerConnection
      .setRemoteDescription(offer)
      .then(() => peerConnection.createAnswer())
      .then((answer) => {
        peerConnection.setLocalDescription(answer);
        socket.emit("answer", peerConnection.localDescription);
      });
  };

  const handleCandidate = (candidate) => {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  };

  const init = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localVideoRef.current.srcObject = stream;
        setLocalStream(stream);
      })
      .catch((error) => console.error("Error accessing media devices.", error));
  };

  React.useEffect(() => {
    init();

    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("candidate", handleCandidate);

    return () => {
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("candidate", handleCandidate);
    };
  }, [peerConnection]);

  return (
    <div>
      <h1>WebRTC Video Call</h1>
      <video ref={localVideoRef} autoPlay muted></video>
      <video ref={remoteVideoRef} autoPlay></video>
      <button onClick={startCall}>Start Call</button>
    </div>
  );
}

export default App;
