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
  const [tieMessage, setTieMessage] = useState("");
  const [isTripleTie, setIsTripleTie] = useState(false);

  useEffect(() => {
    console.log("Cargando podio... Pidiendo resultados finales.");

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
      let tieText = "";

      const isTripleTieCheck = p1 && p2 && p3 && p1.score === p2.score && p2.score === p3.score && p1.score > 0;
      const isDoubleTieCheck = (p1 && p2 && p1.score === p2.score && p1.score > 0) || (p2 && p3 && p2.score === p3.score && p2.score > 0);

      if (isTripleTieCheck) {
        tieDetected = true;
        tieText = "⚡ ¡INCREÍBLE! ¡TRIPLE EMPATE EN LA CIMA! ⚡";
        setIsTripleTie(true); // Avisamos que es triple
      } else if (isDoubleTieCheck) {
        tieDetected = true;
        tieText = "⚡ ¡Empate de puntos detectado! ⚡";
        setIsTripleTie(false);
      } else {
        setIsTripleTie(false);
      }

      setIsTie(tieDetected);
      setTieMessage(tieText);

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
      // 1. SUSPENSO: Muestra letrero de empate
      setTimeout(() => setStep(1.5), 2500);
      
      // 2. REVELA A LOS DOS AL MISMO TIEMPO (2do y 1er lugar juntos + confeti)
      setTimeout(() => {
        setStep(3); 
        triggerConfetti();
      }, 6000);
    } else {
      // Flujo normal sin empate (escalonado)
      setTimeout(() => setStep(2), 2000); // Muestra 2do
      setTimeout(() => {
        setStep(3);
        triggerConfetti();
      }, 4000); // Muestra 1ro
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

  // --- VISTA: PODIO NEÓN ---
  return (
    <div style={{ 
      minHeight: "100vh", 
      width: "100%",
      // Fondo oscuro tipo escenario
      background: "radial-gradient(circle at top, #7A0A1A 0%, #3A0512 60%, #1A0005 100%)", 
      color: "white", 
      fontFamily: "'Poppins', 'Monserrat'", 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      overflowY: "auto",  
      paddingBottom: "50px",
      position: "relative"
    }}>
      
      {/* LUCES DE ESCENARIO (Efecto visual) */}
      <div style={{ position: "absolute", top: 0, left: "20%", width: "150px", height: "400px", background: "radial-gradient(ellipse at top, rgba(255, 215, 0, 0.15) 0%, transparent 70%)", transform: "rotate(-25deg)", pointerEvents: "none" }}></div>
      <div style={{ position: "absolute", top: 0, right: "20%", width: "150px", height: "400px", background: "radial-gradient(ellipse at top, rgba(255, 215, 0, 0.15) 0%, transparent 70%)", transform: "rotate(25deg)", pointerEvents: "none" }}></div>

      {/* TÍTULO ESTILO NEÓN */}
      <div style={{
        marginTop: "30px",
        marginBottom: "30px",
        padding: "10px 40px",
        border: "2px solid #FFD700",
        borderRadius: "30px",
        boxShadow: "0 0 15px #FFD700, inset 0 0 10px #FFD700",
        backgroundColor: "rgba(0,0,0,0.6)",
        zIndex: 20
      }}>
        <h1 style={{ 
          fontSize: "2.2rem", 
          margin: 0,
          textTransform: "uppercase", 
          fontStyle: "'Poppins'",
          letterSpacing: "2px", 
          textShadow: "0 0 10px #FFD700",
          color: "#FFF5E1"
        }}>
          PODIO
        </h1>
      </div>

      {/* ALERTA DE EMPATE (Mantenemos tu lógica igual) */}
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
        {tieMessage} <br/>
          <span style={{ fontSize: "1.2rem", fontWeight: "600" }}>
            Resolviendo posiciones por velocidad de respuesta...
          </span>
        </div>
      )}

      {/* ZONA DEL PODIO */}
     <div style={{ 
        display: "flex", 
        alignItems: "flex-end", 
        justifyContent: "center", 
        gap: "10px", // Más juntos como en la imagen
        width: "100%", 
        maxWidth: "900px",
        marginBottom: "60px",
        zIndex: 10
      }}>

        {/* 🥈 SEGUNDO LUGAR */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "30%", opacity: step >= 2 ? 1 : 0, transition: "all 0.5s", transform: step >= 2 ? "translateY(0)" : "translateY(50px)" }}>
          {second && (
            <>
              {/* Info del Jugador */}
              <div style={{ marginBottom: "15px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                  <img src={second.avatar} alt="avatar" style={{ width: "85px", height: "85px", borderRadius: "50%", border: "4px solid #C0C0C0", backgroundColor: "white", boxShadow: "0 0 15px rgba(192, 192, 192, 0.8)" }} />
                  {/* Medalla de plata */}
                  <div style={{ position: "absolute", bottom: "-5px", right: "-10px", width: "30px", height: "30px", background: "radial-gradient(circle, #E0E0E0 0%, #9E9E9E 100%)", borderRadius: "50%", border: "2px solid white", boxShadow: "0 2px 5px rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "0.8rem" }}>🥈</div>
                </div>
                <div style={{ fontWeight: "900", fontSize: "1.3rem", marginTop: "10px", textTransform: "uppercase", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>{second.name}</div>
                <div style={{ display: "flex", gap: "10px", fontSize: "0.9rem", marginTop: "5px", color: "#E2E8F0" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}><strong style={{ color: "white" }}>{second.score}</strong> <span style={{fontSize: "0.7rem"}}>PTS</span></div>
                  <span style={{ alignSelf: "center" }}>|</span>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}><strong style={{ color: "white" }}>{(second.timeAccumulated / 1000).toFixed(2)}</strong> <span style={{fontSize: "0.7rem"}}>TIEMPO</span></div>
                </div>
              </div>

              {/* Tarima 2do */}
              <div style={{ 
                width: "100%", height: "140px", 
                // Simulando un cilindro 3D con border-radius
                background: "linear-gradient(180deg, #E2E8F0 0%, #94A3B8 20%, #64748B 100%)", 
                borderRadius: "50% 50% 10px 10px / 20px 20px 10px 10px",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                boxShadow: "0 10px 30px rgba(0,0,0,0.8), inset 0 5px 10px rgba(255,255,255,0.5)",
                position: "relative"
              }}>
                {/* Tapa del cilindro */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "40px", background: "#F1F5F9", borderRadius: "50%", boxShadow: "inset 0 -2px 5px rgba(0,0,0,0.2)" }}></div>
                <span style={{ fontSize: "1.5rem", fontWeight: "900", color: "#334155", zIndex: 2, marginTop: "20px", textShadow: "0 1px 1px white" }}>2DO LUGAR</span>
              </div>
            </>
          )}
        </div>

        {/* 🥇 PRIMER LUGAR */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "35%", zIndex: 10, opacity: step >= 3 ? 1 : 0, transition: "all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)", transform: step >= 3 ? "scale(1)" : "scale(0.5)" }}>
          {first && (
            <>
              {/* Info del Jugador */}
              <div style={{ marginBottom: "15px", textAlign: "center", position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontSize: "4rem", display: "block", marginBottom: "-25px", filter: "drop-shadow(0 0 10px #FFD700)", position: "relative", zIndex: 11 }}>👑</span>
                <div style={{ position: "relative" }}>
                  <img src={first.avatar} alt="avatar" style={{ width: "110px", height: "110px", borderRadius: "50%", border: "5px solid #FFD700", backgroundColor: "white", position: "relative", zIndex: 10, boxShadow: "0 0 25px rgba(255, 215, 0, 0.8)" }} />
                  {/* Medalla de oro */}
                  <div style={{ position: "absolute", bottom: "-5px", right: "-10px", width: "35px", height: "35px", background: "radial-gradient(circle, #FFD700 0%, #B8860B 100%)", borderRadius: "50%", border: "2px solid white", boxShadow: "0 2px 5px rgba(0,0,0,0.5)", zIndex: 12, display: "flex", justifyContent: "center", alignItems: "center", fontSize: "1rem" }}>🥇</div>
                </div>
                <div style={{ fontWeight: "900", fontSize: "1.6rem", marginTop: "10px", textTransform: "uppercase", textShadow: "0 0 10px #FFD700" }}>{first.name}</div>
                <div style={{ display: "flex", gap: "10px", fontSize: "1rem", marginTop: "5px", color: "#FFF5E1" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}><strong style={{ color: "#FFD700" }}>{first.score}</strong> <span style={{fontSize: "0.8rem"}}>PTS</span></div>
                  <span style={{ alignSelf: "center" }}>|</span>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}><strong style={{ color: "#FFD700" }}>{(first.timeAccumulated / 1000).toFixed(2)}</strong> <span style={{fontSize: "0.8rem"}}>TIEMPO</span></div>
                </div>
              </div>

              {/* Tarima 1ro */}
              <div style={{ 
                width: "100%", height: "190px", 
                background: "linear-gradient(180deg, #FFD700 0%, #D4AF37 20%, #B8860B 100%)", 
                borderRadius: "50% 50% 10px 10px / 20px 20px 10px 10px",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                boxShadow: "0 10px 40px rgba(255, 215, 0, 0.3), inset 0 5px 10px rgba(255,255,255,0.6)",
                position: "relative"
              }}>
                 {/* Tapa del cilindro */}
                 <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "45px", background: "#FFF5E1", borderRadius: "50%", boxShadow: "inset 0 -3px 8px rgba(184, 134, 11, 0.5)" }}></div>
                <span style={{ fontSize: "1.8rem", fontWeight: "900", color: "#5A3A00", zIndex: 2, marginTop: "20px", textShadow: "0 1px 1px rgba(255,255,255,0.8)" }}>1ER LUGAR</span>
              </div>
            </>
          )}
        </div>

        {/* 🥉 TERCER LUGAR */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "30%", opacity: (step >= 1 && !isTripleTie) || step >= 3 ? 1 : 0, transition: "all 0.5s", transform: (step >= 1 && !isTripleTie) || step >= 3 ? "translateY(0)" : "translateY(50px)" }}>
          {third && (
            <>
               {/* Info del Jugador */}
               <div style={{ marginBottom: "15px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                  <img src={third.avatar} alt="avatar" style={{ width: "85px", height: "85px", borderRadius: "50%", border: "4px solid #CD7F32", backgroundColor: "white", boxShadow: "0 0 15px rgba(205, 127, 50, 0.8)" }} />
                  {/* Medalla de bronce */}
                  <div style={{ position: "absolute", bottom: "-5px", right: "-10px", width: "30px", height: "30px", background: "radial-gradient(circle, #CD7F32 0%, #8B4513 100%)", borderRadius: "50%", border: "2px solid white", boxShadow: "0 2px 5px rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "0.8rem" }}>🥉</div>
                </div>
                <div style={{ fontWeight: "900", fontSize: "1.3rem", marginTop: "10px", textTransform: "uppercase", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>{third.name}</div>
                <div style={{ display: "flex", gap: "10px", fontSize: "0.9rem", marginTop: "5px", color: "#E2E8F0" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}><strong style={{ color: "white" }}>{third.score}</strong> <span style={{fontSize: "0.7rem"}}>PTS</span></div>
                  <span style={{ alignSelf: "center" }}>|</span>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}><strong style={{ color: "white" }}>{(third.timeAccumulated / 1000).toFixed(2)}</strong> <span style={{fontSize: "0.7rem"}}>TIEMPO</span></div>
                </div>
              </div>

              {/* Tarima 3ro */}
              <div style={{ 
                width: "100%", height: "110px", 
                background: "linear-gradient(180deg, #D28F5A 0%, #B86B35 20%, #8B4513 100%)", 
                borderRadius: "50% 50% 10px 10px / 20px 20px 10px 10px",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                boxShadow: "0 10px 30px rgba(0,0,0,0.8), inset 0 5px 10px rgba(255,255,255,0.3)",
                position: "relative"
              }}>
                {/* Tapa del cilindro */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "40px", background: "#E8A776", borderRadius: "50%", boxShadow: "inset 0 -2px 5px rgba(139, 69, 19, 0.4)" }}></div>
                <span style={{ fontSize: "1.5rem", fontWeight: "900", color: "#3E1F08", zIndex: 2, marginTop: "20px", textShadow: "0 1px 1px rgba(255,255,255,0.4)" }}>3ER LUGAR</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* LISTA DE RESULTADOS (Leaderboard) */}
      <div style={{ width: "100%", maxWidth: "1200px", height: "40px", background: "#7A0A1A", borderRadius: "50%", marginTop: "-70px", boxShadow: "0 5px 15px rgba(0,0,0,0.8), inset 0 5px 5px #A50E24", zIndex: 5 }}></div>
      <div style={{ width: "110%", maxWidth: "1300px", height: "30px", background: "#3A0512", borderRadius: "50%", marginTop: "-15px", boxShadow: "0 10px 20px rgba(0,0,0,0.9)", zIndex: 4 }}></div>
        
        {/* --- MURO DE LA FAMA (Tabla General) --- */}
      <div style={{ 
        width: "90%", maxWidth: "700px", 
        marginTop: "60px", 
        animation: "slideUp 1.5s ease"
      }}>
        <h3 style={{ 
          textAlign: "center", 
          fontStyle: "italic", 
          textTransform: "uppercase", 
          letterSpacing: "2px", 
          color: "#FFF5E1", 
          textShadow: "0 0 10px rgba(255,255,255,0.5)",
          marginBottom: "10px"
        }}>
          MURO DE LA FAMA
        </h3>
        
        {/* Encabezados de tabla */}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "0 20px", marginBottom: "10px", color: "#FFD700", fontWeight: "bold", fontSize: "0.9rem" }}>
          <div style={{ width: "60px", textAlign: "center" }}>Rango</div>
          <div style={{ flex: 1, paddingLeft: "20px" }}>Nombre del Jugador</div>
          <div style={{ width: "120px", textAlign: "right" }}>Puntuación</div>
          <div style={{ width: "100px", textAlign: "right" }}>Tiempo</div>
        </div>
        
        {/* Línea divisoria */}
        <div style={{ width: "100%", height: "2px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)", marginBottom: "15px" }}></div>

        {/* Lista de jugadores */}
        {sortedPlayers.slice(3).map((p, index) => (
          <div key={index} style={{ 
            display: "flex", alignItems: "center", justifyContent: "space-between",
            backgroundColor: index % 2 === 0 ? "rgba(255,255,255,0.05)" : "transparent", // Efecto cebra
            padding: "12px 20px", borderRadius: "8px", transition: "background 0.3s"
          }}>
            <div style={{ width: "60px", textAlign: "center", fontWeight: "bold", fontSize: "1.1rem", color: "#E2E8F0" }}>
              {index + 4}
            </div>
            <div style={{ flex: 1, paddingLeft: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
              <img src={p.avatar} alt="av" style={{ width: "30px", height: "30px", borderRadius: "50%", background: "white" }} />
              <span style={{ fontSize: "1.1rem" }}>{p.name}</span>
            </div>
            <div style={{ width: "120px", textAlign: "right", color: "#FFD700" }}>{p.score} pts</div>
            <div style={{ width: "100px", textAlign: "right", color: "#FFD700" }}>{(p.timeAccumulated / 1000).toFixed(2)}s</div>
          </div>
        ))}

        {sortedPlayers.length <= 3 && (
          <div style={{ textAlign: "center", opacity: 0.5, fontStyle: "italic", marginTop: "20px" }}>
            No hay más jugadores para mostrar
          </div>
        )}
      </div>

      {/* BOTÓN SALIR / VOLVER AL LOBBY */}
      {step === 3 && (
        <button 
          onClick={() => navigate("/host")} 
          style={{ 
            marginTop: "40px",
            padding: "12px 30px", 
            borderRadius: "10px", 
            border: "2px solid #FFD700", 
            cursor: "pointer", 
            background: "rgba(0,0,0,0.5)", 
            color: "#FFD700", 
            fontWeight: "bold", 
            textTransform: "uppercase",
            letterSpacing: "1px",
            transition: "all 0.3s",
            boxShadow: "0 0 10px rgba(255, 215, 0, 0.5)",
            zIndex: 100 
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = "#FFD700"; e.currentTarget.style.color = "#3A0512"; }}
          onMouseOut={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.5)"; e.currentTarget.style.color = "#FFD700"; }}
        >
          VOLVER AL LOBBY
        </button>
      )}

      <style>{`
        @keyframes slideUp { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes popIn { 0% { transform: scale(0.5); opacity: 0; } 80% { transform: scale(1.05); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}