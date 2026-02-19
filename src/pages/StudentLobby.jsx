import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { socket } from "../socket";

export default function StudentLobby() {
  const { pin } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const myName = location.state?.name || localStorage.getItem("join_name");
  const myAvatar = location.state?.avatar || localStorage.getItem("join_avatar_url");

  const [status, setStatus] = useState("Esperando al profesor...");

  useEffect(() => {
    // 1. RE-CONEXIÓN DE SEGURIDAD (La clave para móviles) 🔑
    // Si por algo el socket se desconectó, nos aseguramos de volver a unirnos a la sala
    if (socket.connected) {
      socket.emit("join_room", { roomCode: pin, playerName: myName, avatar: myAvatar });
    }

    // 2. ESCUCHAR EL INICIO DEL JUEGO
    const handleGameStart = () => {
      console.log("🚀 ¡El juego comenzó! Moviendo al control...");
      setStatus("¡El juego comienza! 🚀");
      
      // Pequeña pausa para efecto visual
      setTimeout(() => {
        navigate(`/game/${pin}`, { state: { name: myName } });
      }, 500); 
    };

    socket.on("game_started", handleGameStart);

    // 3. LOG DE DIAGNÓSTICO
    console.log(`📱 Lobby cargado. Escuchando 'game_started' en sala ${pin}`);

    return () => {
      socket.off("game_started", handleGameStart);
    };
  }, [pin, navigate, myName, myAvatar]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#D8E983", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "'Poppins', sans-serif", color: "#5A0E24" }}>
      
      {/* MOSTRAMOS EL AVATAR GRANDE */}
      {myAvatar && (
        <div style={{ 
          width: "150px", height: "150px", borderRadius: "50%", 
          backgroundColor: "white", border: "5px solid #5A0E24", 
          marginBottom: "30px", overflow: "hidden", animation: "bounce 2s infinite"
        }}>
          <img src={myAvatar} alt="Yo" style={{ width: "100%", height: "100%" }} />
        </div>
      )}
      
      <h1 style={{ fontSize: "2rem", marginBottom: "10px", textAlign: "center" }}>¡Estás dentro!</h1>
      <h2 style={{ fontSize: "1.5rem", fontWeight: "800", backgroundColor: "white", padding: "10px 30px", borderRadius: "50px" }}>{myName}</h2>
      
      <p style={{ marginTop: "40px", fontSize: "1.1rem", opacity: 0.8, textAlign: "center", maxWidth: "300px" }}>
        {status}<br/>
        Mira la pantalla principal.
      </p>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}