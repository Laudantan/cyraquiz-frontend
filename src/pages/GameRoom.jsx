import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { socket } from "../socket";

export default function GameRoom() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  // 1. DATOS DE RESPALDO (Para que no falle al dar F5)
  // Si location.state es null, usamos el objeto de la derecha
  const quizData = location.state?.quizData || {
    title: "Modo Prueba (Sin datos)",
    questionsData: []
  };

  const [roomCode, setRoomCode] = useState("Cargando...");
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    // 2. GENERAR PIN SIEMPRE
    console.log("🎲 Iniciando generación de PIN...");
    
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRoomCode(code);
    
    console.log("✅ PIN Generado:", code);

    // 3. CONECTAR AL SOCKET
    if (socket.connected) {
      socket.emit("create_room", code);
    } else {
      socket.connect();
      setTimeout(() => socket.emit("create_room", code), 500);
    }

    // 4. ESCUCHAR JUGADORES (Lista completa)
    socket.on("update_player_list", (allPlayers) => {
      console.log("👥 Lista actualizada:", allPlayers);
      setPlayers(allPlayers);
    });

    // Fallback para versiones viejas del servidor
    socket.on("player_joined", (playerData) => {
      // Si el servidor manda solo uno, lo agregamos (pero preferimos update_player_list)
      const safePlayer = typeof playerData === 'string' 
        ? { name: playerData, avatar: `https://api.dicebear.com/9.x/notionists/svg?seed=${playerData}` } 
        : playerData;
      
      // Solo agregamos si no está ya en la lista (evitar duplicados visuales)
      setPlayers(prev => {
        if (prev.find(p => p.name === safePlayer.name)) return prev;
        return [...prev, safePlayer];
      });
    });

    return () => {
      socket.off("update_player_list");
      socket.off("player_joined");
    };
  }, []); // Array vacío = Se ejecuta solo 1 vez al entrar

  const handleStartGame = () => {
    console.log("🚀 Iniciando juego en sala:", roomCode);
    socket.emit("start_game", roomCode);
    navigate(`/host-game/${roomCode}`, { state: { quizData, players } });
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#5A0E24", color: "white", fontFamily: "'Poppins', sans-serif", display: "flex", flexDirection: "column" }}>
      
      {/* NAVBAR */}
      <nav style={{ padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: "1.5rem" }}>CYRAQuiz</h2>
        <button 
          onClick={() => navigate("/host")}
          style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", padding: "10px 20px", borderRadius: "20px", cursor: "pointer", fontSize: "0.9rem" }}
        >
          Salir
        </button>
      </nav>

      {/* CONTENIDO CENTRAL */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "20px", paddingBottom: "100px" }}>
        
        <h1 style={{ fontSize: "2rem", marginBottom: "5px", opacity: 0.9 }}>¡Únete a la partida!</h1>
        <p style={{ fontSize: "1.1rem", opacity: 0.7, marginBottom: "20px" }}>
          Título: <strong>{quizData.title}</strong>
        </p>

        {/* PIN GIGANTE */}
        <div style={{ 
          backgroundColor: "white", color: "#5A0E24", padding: "15px 50px", 
          borderRadius: "80px", fontSize: "4.5rem", fontWeight: "800", letterSpacing: "8px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.3)", marginBottom: "40px", animation: "pulse 3s infinite"
        }}>
          {roomCode !== "Cargando..." 
            ? `${roomCode.slice(0,2)}-${roomCode.slice(2,4)}-${roomCode.slice(4,6)}` 
            : roomCode
          }
        </div>

        {/* GRID DE JUGADORES */}
        <div style={{ width: "90%", maxWidth: "1200px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.2)", paddingBottom: "10px" }}>
            <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>👤 Conectados: {players.length}</span>
            {players.length === 0 && <span style={{ opacity: 0.5, fontStyle: "italic" }}>Esperando alumnos...</span>}
          </div>

          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", 
            gap: "20px", 
            justifyContent: "center",
            padding: "10px"
          }}>
            {players.map((player, index) => (
              <div key={index} style={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(5px)",
                borderRadius: "15px",
                padding: "15px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                animation: "popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                border: "1px solid rgba(255,255,255,0.1)"
              }}>
                <div style={{ 
                  width: "70px", height: "70px", borderRadius: "50%", 
                  backgroundColor: "white", overflow: "hidden", border: "3px solid #D8E983",
                  marginBottom: "10px", boxShadow: "0 4px 10px rgba(0,0,0,0.2)"
                }}>
                  <img 
                    src={player.avatar || `https://api.dicebear.com/9.x/notionists/svg?seed=${player.name}`} 
                    alt={player.name} 
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                  />
                </div>
                <span style={{ fontWeight: "600", fontSize: "1rem", color: "white", textAlign: "center", width: "100%", wordBreak: "break-word", lineHeight: "1.2" }}>
                  {player.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BARRA INFERIOR */}
      <div style={{ 
        position: "fixed", bottom: 0, left: 0, width: "100%", 
        padding: "20px", backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)",
        display: "flex", justifyContent: "center", borderTop: "1px solid rgba(255,255,255,0.1)"
      }}>
        <button 
          onClick={handleStartGame}
          disabled={players.length === 0}
          style={{
            backgroundColor: players.length > 0 ? "#D8E983" : "#444",
            color: "#5A0E24",
            padding: "15px 80px",
            borderRadius: "50px",
            fontSize: "1.3rem",
            fontWeight: "800",
            border: "none",
            cursor: players.length > 0 ? "pointer" : "not-allowed",
            transition: "all 0.3s",
            boxShadow: players.length > 0 ? "0 0 30px rgba(216, 233, 131, 0.4)" : "none",
            opacity: players.length > 0 ? 1 : 0.6,
            transform: players.length > 0 ? "scale(1.05)" : "scale(1)"
          }}
        >
          {players.length === 0 ? "ESPERANDO JUGADORES..." : "🚀 INICIAR JUEGO"}
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        @keyframes popIn {
          0% { transform: scale(0) translateY(20px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}