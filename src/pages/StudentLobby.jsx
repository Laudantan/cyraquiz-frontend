import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { socket } from "../socket";
import "../styles/StudentLobby.css";

export default function StudentLobby() {
  const { pin } = useParams();
  const location = useLocation();
  const navigate = useNavigate(); 
  const myName = location.state?.name || localStorage.getItem("join_name");
  const myAvatar = location.state?.avatar || localStorage.getItem("join_avatar_url");
  const [status, setStatus] = useState("Esperando al profesor...");

  useEffect(() => {
    const joinRoom = () => {
      console.log("Intentando unirse a la sala...");
      socket.emit("join_room", { roomCode: pin, playerName: myName, avatar: myAvatar });
    };

    if (socket.connected) {
      joinRoom();
    }

    socket.on("connect", joinRoom);

    const handleGameStart = () => {
      console.log("¡El juego comenzó! Moviendo al control...");
      setStatus("¡El juego comienza!");
      
      setTimeout(() => {
        navigate(`/game/${pin}`, { state: { name: myName } });
      }, 500); 
    };

    const handleLateJoin = () => {
      console.log("¡El juego ya estaba en curso! Brincando directo al control...");
      navigate(`/game/${pin}`, { state: { name: myName } });
    };

    socket.on("game_started", handleGameStart);
    socket.on("new_question", handleLateJoin);

    return () => {
      socket.off("connect", joinRoom);
      socket.off("game_started", handleGameStart);
      socket.off("new_question", handleLateJoin);
    };
  }, [pin, navigate, myName, myAvatar]);

  return (
    <div className="student-lobby-wrapper">
      {myAvatar && (
        <div className="student-avatar-container">
          <img src={myAvatar} alt="Yo" className="student-avatar-img" />
        </div>
      )}
      
      <h1 className="student-lobby-title">¡Estás dentro!</h1>
      <h2 className="student-lobby-name">{myName}</h2>

      <p className="student-lobby-status">
        {status}<br/>
        Mira la pantalla principal.
      </p>
    </div>
  );
}