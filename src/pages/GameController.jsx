import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { socket } from "../socket";

export default function GameController() {
  const { pin } = useParams();
  const location = useLocation();
  // Recuperamos el nombre, si no viene en state, lo buscamos en localStorage
  const myName = location.state?.name || localStorage.getItem("join_name") || "Jugador";
  const navigate = useNavigate();

  // --- ESTADOS ---
  // 'waiting'   -> Esperando pregunta
  // 'answering' -> Viendo botones
  // 'submitted' -> Ya respondió, esperando resultado
  // 'result'    -> Viendo si ganó o perdió (Feedback)
  // 'game_over' -> Pantalla final con su lugar en el podio
  const [gameState, setGameState] = useState("waiting");

  const [currentOptions, setCurrentOptions] = useState([]);
  const [questionType, setQuestionType] = useState("single"); // 'single' o 'multi'
  const [selectedOptions, setSelectedOptions] = useState([]); // Para Multi-Select
  
  // Datos de resultado parcial (puntos de la pregunta actual)
  const [resultData, setResultData] = useState({ isCorrect: false, pointsEarned: 0, totalScore: 0 });
  
  // Datos de resultado final (Ranking)
  const [finalRank, setFinalRank] = useState(0);

  const [podiumStep, setPodiumStep] = useState(0);

  useEffect(() => {
    // 1. ESCUCHAR NUEVA PREGUNTA
    const onNewQuestion = (q) => {
      console.log("Nueva pregunta recibida:", q);
      setCurrentOptions(q.options);
      setQuestionType(q.type);
      setSelectedOptions([]); // Limpiar selección anterior
      setGameState("answering"); // Mostrar botones
    };

    // 2. ESCUCHAR RESULTADO DE LA PREGUNTA
    const onAnswerResult = (result) => {
      console.log("Resultado secreto recibido:", result);
      setResultData(result);
    };

    const onRevealResults = () => {
      setGameState("result"); // AHORA SÍ mostramos la pantalla Verde/Roja
    };

    // 3. ESCUCHAR FIN DEL JUEGO (PODIO)
    const onFinalResults = (sortedList) => {
      console.log("Juego terminado. Lista:", sortedList);
      // Buscamos nuestro índice en la lista ordenada
      
      const myIndex = sortedList.findIndex(p => p.name === myName);
      setFinalRank(myIndex + 1); // +1 porque el índice empieza en 0
      setGameState("game_over");

      setTimeout(() => setPodiumStep(1), 500);  // Se revela el 3ro y el resto
      setTimeout(() => setPodiumStep(2), 2000); // Se revela el 2do
      setTimeout(() => setPodiumStep(3), 4000); // Se revela el 1ro
    };

    const onGameCancelled = () => {
      alert("El profesor ha terminado la partida.");
      navigate("/join"); // Regresa al alumno al inicio
    };

    socket.on("new_question", onNewQuestion);
    socket.on("answer_result", onAnswerResult);
    socket.on("reveal_results", onRevealResults);
    socket.on("final_results", onFinalResults);
    socket.on("game_cancelled", onGameCancelled);

    return () => {
      socket.off("new_question", onNewQuestion);
      socket.off("answer_result", onAnswerResult);
      socket.off("reveal_results", onRevealResults);
      socket.off("final_results", onFinalResults);
      socket.off("game_cancelled", onGameCancelled);
    };
  }, [myName, navigate]);

  // --- LÓGICA DE CLICS ---

  const handleOptionClick = (option) => {
    if (questionType === "multi") {
      // MODO MULTI: Toggle (Seleccionar / Deseleccionar)
      if (selectedOptions.includes(option)) {
        setSelectedOptions(prev => prev.filter(o => o !== option));
      } else {
        // (Opcional) Podrías limitar a máximo 2 selecciones aquí si quisieras
        setSelectedOptions(prev => [...prev, option]);
      }
    } else {
      // MODO SINGLE: Enviar inmediatamente
      submitToServer(option);
    }
  };

  const handleMultiSubmit = () => {
    // Botón manual para enviar en modo Multi
    submitToServer(selectedOptions);
  };

  const submitToServer = (answerData) => {
    setGameState("submitted"); // Pantalla de carga
    socket.emit("submit_answer", { 
      roomCode: pin, 
      playerName: myName, 
      answer: answerData 
    });
  };

  // ==========================================
  // VISTAS (PANTALLAS)
  // ==========================================

  // 1. PANTALLA DE ESPERA (Ojos moviéndose)
  if (gameState === "waiting") {
    return (
      <div style={screenStyle}>
        <div style={{ fontSize: "5rem", animation: "bounce 1.5s infinite" }}>👀</div>
        <h2 style={{ marginTop: "20px" }}>¡Atento a la pantalla!</h2>
        <p style={{ opacity: 0.8 }}>La pregunta está por salir...</p>
        <div style={{ marginTop: "30px", fontSize: "0.9rem", opacity: 0.5 }}>Jugador: {myName}</div>
      </div>
    );
  }

  // 2. PANTALLA DE "ENVIADO" (Cohete)
  if (gameState === "submitted") {
    return (
      <div style={{ ...screenStyle, backgroundColor: "#46178F" }}>
        <div style={{ fontSize: "5rem", animation: "fly 1s infinite alternate" }}>🚀</div>
        <h2 style={{ marginTop: "20px" }}>Respuesta enviada...</h2>
      </div>
    );
  }

  // 3. PANTALLA DE RESULTADO PARCIAL (Verde/Roja)
  if (gameState === "result") {
    const bg = resultData.isCorrect ? "#2E7D32" : "#C62828"; // Verde Éxito o Rojo Error
    const title = resultData.isCorrect ? "¡Correcto!" : "¡Incorrecto!";
const circleBg = resultData.isCorrect ? "#00E676" : "#FF5252"; // Un tono más brillante para el círculo
    const iconSymbol = resultData.isCorrect ? "✔" : "✖";
    
    return (
      <div style={{ ...screenStyle, backgroundColor: bg }}>
        
        {/* --- NUEVO: Círculo con el ícono --- */}
        <div style={{ 
          width: "130px", 
          height: "130px", 
          borderRadius: "50%", 
          backgroundColor: circleBg, 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          color: "white", 
          fontSize: "6rem", 
          fontWeight: "bold",
          marginBottom: "20px",
          boxShadow: "0 6px 15px rgba(0,0,0,0.2)" // Sombrita para que resalte del fondo
        }}>
          {iconSymbol}
        </div>

        <h1 style={{ fontSize: "3rem", fontWeight: "900", margin: 0, textShadow: "0 2px 5px rgba(0,0,0,0.2)" }}>{title}</h1>
        
        <div style={{ background: "rgba(0,0,0,0.2)", padding: "20px", borderRadius: "15px", marginTop: "30px", width: "80%" }}>
          <p style={{ margin: 0, opacity: 0.8, textTransform: "uppercase", fontSize: "0.9rem" }}>Puntos Ganados</p>
          <h3 style={{ margin: "5px 0", fontSize: "2rem" }}>+{resultData.pointsEarned}</h3>
        </div>

        <div style={{ marginTop: "20px", fontWeight: "bold", fontSize: "1.2rem" }}>
          Puntaje Total: {resultData.totalScore}
        </div>
      </div>
    );
  }

  // 4. PANTALLA FINAL (GAME OVER / RANKING)
  if (gameState === "game_over") {

    let isWaiting = false;
    // Si soy 1er lugar y el profe aún no llega al paso 3 -> Suspenso
    if (finalRank === 1 && podiumStep < 3) isWaiting = true;
    // Si soy 2do lugar y el profe aún no llega al paso 2 -> Suspenso
    if (finalRank === 2 && podiumStep < 2) isWaiting = true;
    // Si soy 3er lugar (o peor) y el profe aún no inicia (paso 1) -> Suspenso
    if (finalRank >= 3 && podiumStep < 1) isWaiting = true;

    if (isWaiting) {
      return (
        <div style={{ ...screenStyle, backgroundColor: "#5A0E24" }}>
          <div style={{ fontSize: "5rem", animation: "bounce 0.4s infinite alternate" }}>🥁</div>
          <h2 style={{ marginTop: "20px" }}>¡Calculando posiciones!</h2>
          <p style={{ opacity: 0.8, fontSize: "1.2rem" }}>Voltea a la pantalla principal...</p>
        </div>
      );
    }
    
    let message = "¡Buen trabajo!";
    let bg = "#46178F"; // Morado default
    let medal = "";

    if (finalRank === 1) { 
      message = "¡CAMPEÓN!"; 
      bg = "#FFD700"; // Dorado
      medal = "👑";
    } else if (finalRank === 2) { 
      message = "¡Subcampeón!"; 
      bg = "#C0C0C0"; // Plata
      medal = "🥈";
    } else if (finalRank === 3) { 
      message = "¡Tercer Lugar!"; 
      bg = "#CD7F32"; // Bronce
      medal = "🥉";
    } else if (finalRank <= 10) { 
      message = "¡Top 10!"; 
      bg = "#1565C0"; // Azul
    }

    // Ajuste de color de texto para fondo dorado
    const textColor = finalRank === 1 ? "#5A0E24" : "white";

    return (
      <div style={{ ...screenStyle, backgroundColor: bg, color: textColor }}>
        <div style={{ fontSize: "4rem", marginBottom: "10px" }}>{medal}</div>
        <p style={{ fontSize: "1.2rem", margin: 0, opacity: 0.8 }}>Quedaste en</p>
        <h1 style={{ fontSize: "4rem", fontWeight: "900", margin: "10px 0" }}>#{finalRank}</h1>
        <h2 style={{ fontSize: "2rem", textTransform: "uppercase" }}>{message}</h2>
        
        <div style={{ marginTop: "40px", fontSize: "1.2rem", borderTop: `1px solid ${textColor}`, paddingTop: "20px", width: "80%" }}>
          Puntaje Final: <strong>{resultData.totalScore} pts</strong>
        </div>

        <button 
          onClick={() => navigate("/join")}
          style={{
            marginTop: "30px",
            padding: "15px 40px",
            borderRadius: "30px",
            border: "none",
            backgroundColor: textColor === "white" ? "white" : "#5A0E24",
            color: textColor === "white" ? "#5A0E24" : "white",
            fontSize: "1.2rem",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
          }}
        >
          Salir del Juego
        </button>
      </div>
    );
  }

  // 5. PANTALLA DE JUEGO (BOTONES)
  // Esta es la vista por defecto ("answering")
  const colors = ["#B77466", "#851535", "#9195F6", "#574964"]; // Rojo, Azul, Amarillo, Verde
  const icons = ["▲", "◆", "●", "■"];

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      
      {/* Barra superior informativa */}
      <div style={{ padding: "15px", textAlign: "center", background: "#222", color: "white", fontSize: "1.1rem" }}>
        {questionType === "multi" ? "Selecciona dos opciones" : "Selecciona una opción"}
      </div>

      {/* Grid de Botones */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr" }}>
        {currentOptions.map((opt, i) => {
          // Lógica visual para Multi-Select
          const isSelected = selectedOptions.includes(opt);
          // Si es multi y hay algo seleccionado, opacamos los NO seleccionados para dar feedback visual
          const opacity = (questionType === "multi" && selectedOptions.length > 0 && !isSelected) ? 0.6 : 1;
          
          return (
            <button
              key={i}
              onClick={() => handleOptionClick(opt)}
              style={{
                backgroundColor: colors[i % 4],
                border: isSelected ? "8px solid white" : "none", // Borde grueso si está seleccionado
                opacity: opacity,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                position: "relative",
                transition: "all 0.1s"
              }}
            >
              {/* Check visual en Multi */}
              {isSelected && <span style={{ position: "absolute", top: 15, right: 15, fontSize: "2rem" }}>✅</span>}
              
              <span style={{ fontSize: "4rem", color: "white", filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.3))" }}>
                {icons[i % 4]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Botón de ENVIAR (Solo aparece en Multi-Select) */}
      {questionType === "multi" && (
        <button 
          onClick={handleMultiSubmit}
          style={{
            padding: "25px", 
            background: "#46178F", 
            color: "white", 
            border: "none", 
            fontSize: "1.5rem", 
            fontWeight: "bold",
            letterSpacing: "1px",
            boxShadow: "0 -5px 20px rgba(0,0,0,0.3)"
          }}
        >
          ENVIAR RESPUESTA
        </button>
      )}

      {/* Estilos para animaciones */}
      <style>{`
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        @keyframes fly { from { transform: translateY(5px); } to { transform: translateY(-5px); } }
      `}</style>
    </div>
  );
}

// Estilos base para las pantallas de pantalla completa (Espera, Resultado, etc.)
const screenStyle = {
  minHeight: "100vh",
  backgroundColor: "#333",
  color: "white",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "'Poppins', sans-serif",
  textAlign: "center",
  padding: "20px"
};