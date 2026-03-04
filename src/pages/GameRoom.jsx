import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { socket } from "../socket";
import useSound from "use-sound";
import "../styles/GameRoom.css";

export default function GameRoom() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const quizData = location.state?.quizData || {
    title: "Modo Prueba (Sin datos)",
    questionsData: []
  };

  const [roomCode, setRoomCode] = useState("Cargando...");
  const [players, setPlayers] = useState([]);

  const [playLobby, { stop: stopLobby }] = useSound("/lobby.mp3", {
    volume: 0.4,
    loop: true 
  });

  useEffect(() => {
    playLobby(); 

    return () => {
      stopLobby(); 
    };
  }, [playLobby, stopLobby]);

  useEffect(() => {
    console.log("Iniciando generación de PIN...");
    
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setRoomCode(code);
    
    console.log("PIN Generado:", code);

    if (socket.connected) {
      socket.emit("create_room", code);
    } else {
      socket.connect();
      setTimeout(() => socket.emit("create_room", code), 500);
    }

    socket.on("update_player_list", (allPlayers) => {
      console.log("Lista actualizada:", allPlayers);
      setPlayers(allPlayers);
    });

    socket.on("player_joined", (playerData) => {
      const safePlayer = typeof playerData === 'string' 
        ? { name: playerData, avatar: `https://api.dicebear.com/9.x/notionists/svg?seed=${playerData}` } 
        : playerData;

      setPlayers(prev => {
        if (prev.find(p => p.name === safePlayer.name)) return prev;
        return [...prev, safePlayer];
      });
    });

    return () => {
      socket.off("update_player_list");
      socket.off("player_joined");
    };
  }, []);

  const handleStartGame = () => {
    console.log("Iniciando juego en sala:", roomCode);
    stopLobby();
    socket.emit("start_game", roomCode);
    navigate(`/host-game/${roomCode}`, { state: { quizData, players } });
  };

  return (
    <div className="gameroom-wrapper">

      <nav className="gameroom-navbar">
        <h2 className="gameroom-logo">CYRAQuiz</h2>
        <button 
          onClick={() => navigate("/host")}
          className="btn-exit-lobby"
        >
          Salir
        </button>
      </nav>

      <div className="gameroom-content">
        
        <h1 className="lobby-title">¡Únete a la partida!</h1>
        <p className="lobby-subtitle">
          Título: <strong>{quizData.title}</strong>
        </p>

        <div className="pin-display-box">
          {roomCode !== "Cargando..." 
            ? `${roomCode.slice(0,2)}-${roomCode.slice(2,4)}-${roomCode.slice(4,6)}` 
            : roomCode
          }
        </div>

        <div className="players-container">
          
          <div className="players-header">
            <span className="players-count">Conectados: {players.length}</span>
            {players.length === 0 && <span className="players-waiting">Esperando alumnos...</span>}
          </div>

          <div className="players-grid">
            {players.map((player, index) => (
              <div key={index} className="player-card">
                <div className="player-avatar-wrapper">
                  <img 
                    src={player.avatar || `https://api.dicebear.com/9.x/notionists/svg?seed=${player.name}`} 
                    alt={player.name} 
                    className="player-avatar-img" 
                  />
                </div>
                <span className="player-name">
                  {player.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bottom-bar-container">
        <button 
          onClick={handleStartGame}
          disabled={players.length === 0}
          className="btn-start-game"
        >
          {players.length === 0 ? "ESPERANDO JUGADORES..." : "🚀 INICIAR JUEGO"}
        </button>
      </div>
    </div>
  );
}