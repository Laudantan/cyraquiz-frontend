import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../socket";

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

  // --- FUNCIÓN PARA IR AL LOBBY (PLAN B) ---
  const goToLobby = () => {
    localStorage.setItem("join_roomCode", pin.trim());
    localStorage.setItem("join_name", name.trim());
    localStorage.setItem("join_avatar", selectedAvatar); 
    
    navigate(`/student/lobby/${pin.trim()}`, { 
      state: { name: name.trim(), avatar: `/avatars/${selectedAvatar}` } 
    });
  };

  useEffect(() => {
    // Intentar conectar si se perdió la conexión
    if (!socket.connected) socket.connect();

    const onError = (msg) => {
      setError(msg);
      setTimeout(() => setError(""), 3000);
    };

    const onPlayerJoined = (player) => {
      // Leemos el nombre venga como venga
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
      // Le damos un pequeñísimo retraso para que le dé tiempo de abrir la ventana
      setTimeout(() => {
        const elementoSeleccionado = document.getElementById(`avatar-${selectedAvatar}`);
        if (elementoSeleccionado) {
          // Hace scroll suave hasta centrar el personaje en la pantalla
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
    
    // 1. RECONEXIÓN FORZADA
    if (!socket.connected) {
      console.log("⚠️ Socket desconectado. Intentando reconectar...");
      socket.connect();
    }

    // 2. ENVIAR DATOS
    socket.emit("join_room", { 
      roomCode: pin.trim(), 
      playerName: name.trim(), 
      avatar: `/avatars/${selectedAvatar}` 
    });

    // 3. PLAN B: FUERZA BRUTA (Navegación Optimista)
    // Si en 500ms el servidor no nos ha rechazado con error, entramos igual.
    setTimeout(() => {
      setError((currentError) => {
        // Solo entramos si no apareció un mensaje de error (como "Sala no existe")
        if (!currentError) {
          console.log("🚀 Usando Plan B: Navegación forzada al lobby");
          goToLobby();
        }
        return currentError;
      });
    }, 500);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#5A0E24", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "'Poppins', sans-serif" }}>
      
      <h1 style={{ color: "white", marginBottom: "40px", fontSize: "2.5rem", fontWeight: "800" }}>CYRAQuiz</h1>

      <div style={{ backgroundColor: "white", width: "100%", maxWidth: "400px", borderRadius: "20px", padding: "30px", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
        
        <h2 style={{ textAlign: "center", color: "#333", marginBottom: "20px" }}>Unirse a Partida</h2>

        {/* --- AVATAR --- */}
        <div style={{ position: "relative", marginBottom: "25px", display: "flex", justifyContent: "center" }}>
          <div style={{ position: "relative" }}>
            <div style={{ 
              width: "120px", height: "120px", borderRadius: "50%", 
              border: "4px solid #D8E983", overflow: "hidden", backgroundColor: "#f0f0f0" 
            }}>
              <img 
                src={`/avatars/${selectedAvatar}`} 
                alt="Avatar" 
                style={{ width: "100%", height: "100%", objectFit: "contain" }} 
              />
            </div>
            <button 
              onClick={() => setShowAvatarModal(true)}
              style={{
                position: "absolute", bottom: "0", right: "0",
                backgroundColor: "#333", color: "white", border: "none",
                borderRadius: "50%", width: "40px", height: "40px",
                cursor: "pointer", fontSize: "1.2rem", display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
              }}
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
          style={{ width: "100%", padding: "15px", borderRadius: "10px", border: "2px solid #eee", fontSize: "1.2rem", textAlign: "center", marginBottom: "15px", outline: "none", fontWeight: "bold", color: "#333" }}
        />

        <input 
          type="text" 
          placeholder="Tu Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", padding: "15px", borderRadius: "10px", border: "2px solid #eee", fontSize: "1.2rem", textAlign: "center", marginBottom: "25px", outline: "none", fontWeight: "bold", color: "#333" }}
        />

        {error && <div style={{ color: "red", textAlign: "center", marginBottom: "15px", fontWeight: "bold" }}>⚠️ {error}</div>}

        <button 
          onClick={handleJoin}
          style={{ width: "100%", padding: "15px", borderRadius: "50px", border: "none", backgroundColor: "#D8E983", color: "#5A0E24", fontSize: "1.2rem", fontWeight: "bold", cursor: "pointer", boxShadow: "0 5px 15px rgba(0,0,0,0.1)" }}
        >
          ¡ENTRAR!
        </button>

      </div>

      {/* --- MODAL DE SELECCIÓN --- */}
      {showAvatarModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(0,0,0,0.85)", zIndex: 1000,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
        }}>
          
          <div style={{ width: "90%", maxWidth: "800px", height: "80%", backgroundColor: "#3d3643", borderRadius: "20px", padding: "20px", display: "flex", flexDirection: "column", position: "relative" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #444", paddingBottom: "15px" }}>
              <h2 style={{ color: "white", margin: 0, fontSize: "1.5rem" }}>Selecciona un Avatar</h2>
              <button onClick={() => setShowAvatarModal(false)} style={{ background: "none", border: "none", color: "white", fontSize: "2rem", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ 
              flex: 1, overflowY: "auto", 
              display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: "20px",
              padding: "20px"
            }}>
              {AVATARES.map((img) => (
                <div 
                  key={img}
                  id={`avatar-${img}`}
                  onClick={() => { setSelectedAvatar(img); setShowAvatarModal(false); }}
                  style={{ 
                    cursor: "pointer", borderRadius: "15px", 
                    border: selectedAvatar === img ? "4px solid #00E676" : "2px solid transparent",
                    backgroundColor: "rgba(255,255,255,0.1)", width: "100%", aspectRatio: "1/1",
                    display: "flex", alignItems: "center", justifyContent: "center", padding: "10px", boxSizing: "border-box"
                  }}
                >
                  <img src={`/avatars/${img}`} alt="av" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}