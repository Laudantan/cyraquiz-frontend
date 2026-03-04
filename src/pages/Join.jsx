import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../socket";
import "../styles/Join.css";

const AVATARES = [
  "micky.png", "minnie.png", "pato.png", "goofy.png", "pluto.png",
  "bella.png", "cenicienta.png", "blanca.png", "durmiente.png", 
  "mulan.png", "sirenita.png", "jasmine.png", "tiana.png", "merida.png",
  "rapunzel.png", "moana.png", "woody.png", "buzz.png", "marciano.png",
  "rayo.png", "mate.png", "nemo.png", "dory.png", "baymax.png", "sulley.png", 
  "mike.png", "groot.png", "rocket.png", "spider.png", "iron.png",
  "hulk.png", "capitan.png", "viuda.png", "thor.png", "doctor.png", 
  "wanda.png", "loki.png", "thanos.png", "harry.png", "hermione.png",
  "ron.png", "luna.png", "dum.png", "snape.png", "vold.png", "dobby.png", 
  "hed.png", "buck.png", 
];

export default function Join() {
  const navigate = useNavigate();
  const [pin, setPin] = useState(localStorage.getItem("join_roomCode") || "");
  const [name, setName] = useState(localStorage.getItem("join_name") || "");
  const [error, setError] = useState("");
  const savedAvatar = localStorage.getItem("join_avatar");
  const [selectedAvatar, setSelectedAvatar] = useState((savedAvatar && AVATARES.includes(savedAvatar)) ? savedAvatar : AVATARES[0]);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const goToLobby = () => {
    localStorage.setItem("join_roomCode", pin.trim());
    localStorage.setItem("join_name", name.trim());
    localStorage.setItem("join_avatar", selectedAvatar);     
    navigate(`/student/lobby/${pin.trim()}`, { 
      state: { name: name.trim(), avatar: `/avatars/${selectedAvatar}` } 
    });
  };

  useEffect(() => {
    if (!socket.connected) socket.connect();

    const onError = (msg) => {
      setError(msg);
      setTimeout(() => setError(""), 3000);
    };

    const onPlayerJoined = (player) => {
      const joinedName = typeof player === "string" ? player : (player.name || player.playerName);
      
      if (joinedName === name || joinedName === name.trim()) {
        goToLobby();
      }
    };

    socket.on("error", onError);
    socket.on("player_joined", onPlayerJoined);

    return () => {
      socket.off("error", onError);
      socket.off("player_joined", onPlayerJoined);
    };
  }, [name, pin, selectedAvatar, navigate]);

  useEffect(() => {
    if (showAvatarModal) {
      setTimeout(() => {
        const elementoSeleccionado = document.getElementById(`avatar-${selectedAvatar}`);
        if (elementoSeleccionado) {
          elementoSeleccionado.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 50);
    }
  }, [showAvatarModal, selectedAvatar]);

  const handleJoin = () => {
    if (!pin || !name) {
      setError("Por favor llena ambos campos");
      return;
    }
    setError(""); 

    if (!socket.connected) {
      console.log("⚠️ Socket desconectado. Intentando reconectar...");
      socket.connect();
    }

    socket.emit("join_room", { 
      roomCode: pin.trim(), 
      playerName: name.trim(), 
      avatar: `/avatars/${selectedAvatar}` 
    });

    setTimeout(() => {
      setError((currentError) => {
        if (!currentError) {
          console.log("Usando Plan B: Navegación forzada al lobby");
          goToLobby();
        }
        return currentError;
      });
    }, 500);
  };

  return (
    <div className="join-wrapper">  
      <h1 className="join-logo">CYRAQuiz</h1>
      <div className="join-card">
        <h2 className="join-title">Unirse a Partida</h2>

        <div className="avatar-preview-container">
          <div className="avatar-preview-wrapper">
            <div className="avatar-preview-circle">
              <img 
                src={`/avatars/${selectedAvatar}`} 
                alt="Avatar" 
                className="avatar-preview-img" 
              />
            </div>
            <button 
              onClick={() => setShowAvatarModal(true)}
              className="btn-edit-avatar"
              title="Cambiar Avatar"
            >
              ✏️
            </button>
          </div>
        </div>

        <input 
          type="text" 
          placeholder="PIN de Juego"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="join-input"
        />

        <input 
          type="text" 
          placeholder="Tu Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="join-input input-spacing"
        />

        {error && <div style={{ color: "red", textAlign: "center", marginBottom: "15px", fontWeight: "bold" }}>⚠️ {error}</div>}

        <button onClick={handleJoin} className="btn-join">
          ¡ENTRAR!
        </button>
      </div>

      {showAvatarModal && (
        <div className="avatar-modal-overlay">
          <div className="avatar-modal-content">
            
            <div className="avatar-modal-header">
              <h2 className="avatar-modal-title">Selecciona un Avatar</h2>
              <button onClick={() => setShowAvatarModal(false)} className="btn-close-modal">✕</button>
            </div>

            <div className="avatar-grid">
              {AVATARES.map((img) => (
                <div 
                  key={img}
                  id={`avatar-${img}`}
                  onClick={() => { setSelectedAvatar(img); setShowAvatarModal(false); }}
                  className={`avatar-option ${selectedAvatar === img ? "selected" : ""}`}
                >
                  <img src={`/avatars/${img}`} alt="av" className="avatar-option-img" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}