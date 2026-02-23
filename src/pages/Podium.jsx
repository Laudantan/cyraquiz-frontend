import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { socket } from "../socket";
import confetti from "canvas-confetti";

export default function Podium() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  
  // Lista de jugadores (Inicia vacía hasta que el server nos mande la buena)
  const [sortedPlayers, setSortedPlayers] = useState([]);

  // Top 3
  const [first, setFirst] = useState(null);
  const [second, setSecond] = useState(null);
  const [third, setThird] = useState(null);

  // Animación
  const [step, setStep] = useState(0);
  const [isTie, setIsTie] = useState(false);

  useEffect(() => {
    console.log("🏆 Cargando podio... Pidiendo resultados finales.");

    // 1. PEDIR RESULTADOS AL SERVIDOR
    socket.emit("game_over", roomCode);

    // 2. RECIBIR LA LISTA OFICIAL CON PUNTOS
    socket.on("final_results", (results) => {
      console.log("📦 Resultados recibidos:", results);
      
      // Aseguramos que vengan ordenados
      setSortedPlayers(results);
      const p1 = results[0];
      const p2 = results[1];
      const p3 = results[2];

      setFirst(p1);
      setSecond(p2);
      setThird(p3);

      let tieDetected = false;
      if (p1 && p2 && p1.score === p2.score && p1.score > 0) {
        tieDetected = true;
        setIsTie(true);
      }

      // INICIAR ANIMACIÓN (Solo cuando ya tenemos datos)
      startAnimation(tieDetected);
    });

    return () => {
      socket.off("final_results");
    };
  }, []);

    const startAnimation = (tieDetected) => {
    setTimeout(() => setStep(1), 500);  // Muestra 3ro

    if (tieDetected) {
      // 1. SUSPENSO: Muestra letrero ANTES de revelar a los empatados
      setTimeout(() => setStep(1.5), 2500);
      
      // 2. REVELA AL 2DO LUGAR (El que perdió por milisegundos)
      setTimeout(() => setStep(2), 5000);
      
      // 3. REVELA AL GANADOR (1er lugar)
      setTimeout(() => {
        setStep(3); 
        triggerConfetti();
      }, 7500);
    } else {
      // Flujo normal sin empate
      setTimeout(() => setStep(2), 2000); // Muestra 2do
      setTimeout(() => {
        setStep(3);
        triggerConfetti();
      }, 4000);
    }
  };

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#D8E983', '#ffffff', '#5A0E24'] });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#D8E983', '#ffffff', '#5A0E24'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  return (
    <div style={{ 
      minHeight: "100vh", // CAMBIO 1: Permite que la página crezca si hay mucho contenido
      width: "100%",
      backgroundColor: "#5A0E24", 
      color: "white", 
      fontFamily: "'Poppins', sans-serif", 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      overflowY: "auto",  // CAMBIO 2: Activa el scroll vertical
      paddingBottom: "50px" // Un respiro al final para que no se corte
    }}>
      
      {/* TÍTULO */}
      <h1 style={{ 
        fontSize: "3rem", 
        marginTop: "20px",      // Espacio arriba
        marginBottom: "5px",  // CAMBIO 3: Ajustado (antes 300px) para que no empuje tanto el podio
        textTransform: "uppercase", 
        letterSpacing: "5px", 
        textShadow: "0 5px 15px rgba(0,0,0,0.5)",
        zIndex: 20, 
        position: "relative"
      }}>
        🏆 Podio Final 🏆
      </h1>

      {step === 1.5 && isTie && (
        <div style={{
          backgroundColor: "#FFD700",
          color: "#5A0E24",
          padding: "15px 40px",
          borderRadius: "50px",
          fontWeight: "900",
          fontSize: "1.5rem",
          marginBottom: "20px",
          animation: "popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          boxShadow: "0 5px 20px rgba(0,0,0,0.4)",
          textAlign: "center",
          zIndex: 50
        }}>
          ⚡ ¡Empate de puntos! ⚡<br/>
          <span style={{ fontSize: "1.2rem", fontWeight: "600" }}>Resolviendo por velocidad... el más rápido fue en <strong>{(first.timeAccumulated / 1000).toFixed(2)}s</strong>
          </span>
        </div>
      )}

      {/* ZONA DEL PODIO */}
      <div style={{ 
        display: "flex", 
        alignItems: "flex-end", 
        justifyContent: "center", 
        gap: "20px", 
        // Eliminamos height fijo para que no choque
        width: "100%", 
        maxWidth: "900px",
        marginBottom: "40px" // Separación entre el podio y la lista de abajo
      }}>

        {/* 🥈 SEGUNDO LUGAR */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "30%", opacity: step >= 2 ? 1 : 0, transition: "all 0.5s", transform: step >= 2 ? "translateY(0)" : "translateY(50px)" }}>
          {second && (
            <>
              <div style={{ marginBottom: "15px", textAlign: "center" }}>
                <img src={second.avatar} alt="avatar" style={{ width: "80px", height: "80px", borderRadius: "50%", border: "4px solid #C0C0C0", backgroundColor: "white" }} />
                <div style={{ fontWeight: "bold", fontSize: "1.2rem", marginTop: "5px" }}>{second.name}</div>
              </div>
              <div style={{ 
                width: "100%", height: "180px", backgroundColor: "#C0C0C0", 
                borderTopLeftRadius: "15px", borderTopRightRadius: "15px",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                color: "#5A0E24", boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
              }}>
                <span style={{ fontSize: "3.5rem", fontWeight: "900" }}>2</span>
                <span style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{second.score} pts</span>
                {isTie && <span style={{ fontSize: "1rem", opacity: 0.8 }}>⏱️ {(second.timeAccumulated / 1000).toFixed(2)}s</span>}
              </div>
            </>
          )}
        </div>

        {/* 🥇 PRIMER LUGAR */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "35%", zIndex: 10, opacity: step >= 3 ? 1 : 0, transition: "all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)", transform: step >= 3 ? "scale(1)" : "scale(0.5)" }}>
          {first && (
            <>
              <div style={{ marginBottom: "15px", textAlign: "center", position: "relative" }}>
                <span style={{ fontSize: "4rem", display: "block", marginBottom: "-20px", filter: "drop-shadow(0 0 10px gold)", position: "relative", zIndex: 11 }}>👑</span>
                <img src={first.avatar} alt="avatar" style={{ width: "120px", height: "120px", borderRadius: "50%", border: "6px solid #FFD700", backgroundColor: "white", position: "relative", zIndex: 10 }} />
                <div style={{ fontWeight: "900", fontSize: "1.5rem", marginTop: "10px" }}>{first.name}</div>
              </div>
              <div style={{ 
                width: "100%", height: "260px", backgroundColor: "#FFD700", 
                borderTopLeftRadius: "15px", borderTopRightRadius: "15px",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                color: "#5A0E24", boxShadow: "0 0 50px rgba(255, 215, 0, 0.4)"
              }}>
                <span style={{ fontSize: "5rem", fontWeight: "900" }}>1</span>
                <span style={{ fontSize: "2rem", fontWeight: "bold" }}>{first.score} pts</span>
                {isTie && <span style={{ fontSize: "1.2rem", opacity: 0.9 }}>⏱️ {(first.timeAccumulated / 1000).toFixed(2)}s</span>}
              </div>
            </>
          )}
        </div>

        {/* 🥉 TERCER LUGAR */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "30%", opacity: step >= 1 ? 1 : 0, transition: "all 0.5s", transform: step >= 1 ? "translateY(0)" : "translateY(50px)" }}>
          {third && (
            <>
              <div style={{ marginBottom: "15px", textAlign: "center" }}>
                <img src={third.avatar} alt="avatar" style={{ width: "80px", height: "80px", borderRadius: "50%", border: "4px solid #CD7F32", backgroundColor: "white" }} />
                <div style={{ fontWeight: "bold", fontSize: "1.2rem", marginTop: "5px" }}>{third.name}</div>
              </div>
              <div style={{ 
                width: "100%", height: "120px", backgroundColor: "#CD7F32", 
                borderTopLeftRadius: "15px", borderTopRightRadius: "15px",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                color: "#5A0E24", boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
              }}>
                <span style={{ fontSize: "3rem", fontWeight: "900" }}>3</span>
                <span style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{third.score} pts</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* LISTA DE RESULTADOS (Leaderboard) */}
      <div style={{ 
        width: "90%", maxWidth: "800px", backgroundColor: "rgba(0,0,0,0.2)",
        borderRadius: "20px", padding: "20px",
        marginTop: "10px", animation: "slideUp 1s ease"
        // Quitamos overflowY auto de aquí para que use el scroll de la página
      }}>
        <h3 style={{ borderBottom: "1px solid rgba(255,255,255,0.2)", paddingBottom: "10px", marginBottom: "15px" }}>
          📜 Tabla General
        </h3>
        
        {sortedPlayers.slice(3).map((p, index) => (
          <div key={index} style={{ 
            display: "flex", alignItems: "center", justifyContent: "space-between",
            backgroundColor: "rgba(255,255,255,0.1)", marginBottom: "10px",
            padding: "10px 20px", borderRadius: "10px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              <span style={{ fontWeight: "bold", fontSize: "1.2rem", width: "30px", textAlign: "right" }}>#{index + 4}</span>
              <img src={p.avatar} alt="av" style={{ width: "40px", height: "40px", borderRadius: "50%", background: "white" }} />
              <span style={{ fontSize: "1.1rem" }}>{p.name}</span>
            </div>
            <span style={{ fontWeight: "bold", color: "#D8E983", fontSize: "1.2rem" }}>{p.score} pts</span>
          </div>
        ))}

        {sortedPlayers.length <= 3 && (
          <div style={{ textAlign: "center", opacity: 0.5, fontStyle: "italic", marginTop: "20px" }}>
            No hay más jugadores
          </div>
        )}
      </div>

      {step === 3 && (
        <button onClick={() => navigate("/host")} style={{ position: "absolute", top: 20, right: 20, padding: "10px 20px", borderRadius: "20px", border: "none", cursor: "pointer", background: "white", color: "#5A0E24", fontWeight: "bold", zIndex: 100 }}>
          Salir ✖
        </button>
      )}

      <style>{`@keyframes slideUp { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      @keyframes popIn { 0% { transform: scale(0.5); opacity: 0; } 80% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}