import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { socket } from "../socket";

export default function HostGame() {
  const { roomCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const quizData = location.state?.quizData;
  const players = location.state?.players || [];

  const questionsList = quizData?.questions || quizData?.questionsData || [];

  // ESTADO DEL JUEGO
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null); 
  const [isShowingResult, setIsShowingResult] = useState(false);
  const [answersCount, setAnswersCount] = useState(0);
  const [startCountdown, setStartCountdown] = useState(3);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [stats, setStats] = useState([0, 0, 0, 0]);

  // Variable derivada para la pregunta actual
  const currentQ = questionsList[currentQuestionIndex];

  const handleExitGame = () => {
    socket.emit("cancel_game", roomCode);
    navigate("/host"); 
  };

  // PROTECCIÓN DE SEGURIDAD
  useEffect(() => {
    if (!quizData || !currentQ) {
      console.error("No hay datos de quiz o se acabó el array");
    }
  }, [quizData, currentQ, navigate]);

  // CUENTA REGRESIVA INICIAL (3..2..1)
  useEffect(() => {
    if (startCountdown > 0) {
      const timer = setTimeout(() => setStartCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [startCountdown]);

  useEffect(() => {
    // Si ya se están mostrando los resultados o no hay jugadores, no hacemos nada
    if (isShowingResult || players.length === 0) return;

    // Si la cantidad de respuestas es igual (o mayor) al total de jugadores en la sala
    if (answersCount > 0 && answersCount >= players.length) {
      setTimeLeft(0);           // Cortamos el reloj a 0
      setIsShowingResult(true); // Mostramos la gráfica y la respuesta correcta inmediatamente
    }
  }, [answersCount, players.length, isShowingResult]);

useEffect(() => {
    if (isShowingResult) {
      socket.emit("show_results", roomCode);
    }
  }, [isShowingResult, roomCode]);

  // LOGICA DE PREGUNTA NUEVA
  useEffect(() => {
    if (startCountdown > 0 || !currentQ) return;

    console.log(`📡 Enviando Pregunta ${currentQuestionIndex + 1}:`, currentQ.question);

    setIsShowingResult(false);
    setAnswersCount(0);
    setStats([0, 0, 0, 0]);
    setTimeLeft(currentQ.time || 20); 

    socket.emit("send_question", { 
      roomCode, 
      question: currentQ, 
      time: currentQ.time || 20
    });

    const onPlayerAnswered = () => {
      setAnswersCount((prev) => prev + 1);
    };

    const onUpdateStats = (newStats) => {
      setStats(newStats);
    };

    socket.on("player_answered", onPlayerAnswered);
    socket.on("update_stats", onUpdateStats);

    return () => {
      socket.off("player_answered", onPlayerAnswered);
      socket.off("update_stats", onUpdateStats);
    };
  }, [currentQuestionIndex, startCountdown, roomCode]); 

  // TEMPORIZADOR
  useEffect(() => {
    if (timeLeft === null) return; 

    if (timeLeft > 0 && !isShowingResult) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isShowingResult) {
      setIsShowingResult(true);
    }
  }, [timeLeft, isShowingResult]);

  const handleNext = () => {
    if (currentQuestionIndex < (questionsList.length - 1)) {
      setTimeLeft(null);
      setIsShowingResult(false);
      setAnswersCount(0);
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      navigate(`/podium/${roomCode}`, { state: { quizData, players } });
    }
  };

  if (!currentQ) return <div style={{color:"white", textAlign:"center", marginTop: 50}}>Cargando pregunta...</div>;

  // --- VISTA: CUENTA REGRESIVA 3..2..1 ---
  if (startCountdown > 0) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#5A0E24", color: "white", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", fontFamily: "'Poppins', sans-serif" }}>
        <h2 style={{ fontSize: "2rem", marginBottom: "20px", textTransform: "uppercase", letterSpacing: "5px" }}>¿Listos?</h2>
        <div key={startCountdown} style={{ fontSize: "10rem", fontWeight: "900", animation: "zoomIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)" }}>
          {startCountdown}
        </div>
        <style>{`@keyframes zoomIn { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); } }`}</style>
      </div>
    );
  }

  const formatTime = (seconds) => {
    if (seconds === null) return "...";
    
    // Si es menos de 1 minuto, mostramos solo los segundos (estilo Kahoot)
    if (seconds < 60) return seconds;
    
    // Si es 1 minuto o más, mostramos MM:SS
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    // Agregamos un 0 a la izquierda si los segundos son menores a 10 (ej. 1:05)
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // --- VISTA: JUEGO ---
  return (
    <div style={{ 
      height: "100vh", // Usar altura exacta de pantalla para evitar scroll
      backgroundColor: "#f0f0f0", 
      color: "#5A0E24", 
      fontFamily: "Poppins, Montserrat", 
      display: "flex", 
      flexDirection: "column", 
      overflow: "hidden" // Evita scroll accidental
    }}>

      {/* HEADER: ORGANIZADO COMO LA IMAGEN */}
      <div style={{ 
        padding: "20px 40px", 
        display: "grid", 
        gridTemplateColumns: "150px 1fr 150px", 
        alignItems: "start",
        transition: "all 0.5s ease",
        height: isShowingResult ? "15vh" : "30vh", // Se encoge al mostrar resultados
        minHeight: "120px",
        position: "relative", 
        zIndex: 10
      }}>

        {/* COLUMNA IZQUIERDA: Salir, Contador Preguntas, Respuestas */}
        <div style={{ display: "flex", flexDirection: "column", gap: "40px", alignItems: "flex-start" }}>
          
          {/* Botón Salir */}
          <button 
            onClick={() => setShowCancelModal(true)}
            style={{ 
              background: "#5A0E24", color: "white", border: "none", 
              padding: "7px 18px", borderRadius: "20px", fontWeight: "bold", cursor: "pointer",
              fontSize: "0.8rem"
            }}
          >
            Salir
          </button>

          {/* Contador Preguntas (1/10) */}
          <div style={{ background: "#FFDAB3", color: "#5A0E24", padding: "8px 20px", borderRadius: "20px", fontWeight: "800", fontSize: "1rem" }}>
            {currentQuestionIndex + 1} / {questionsList.length}
          </div>

          {/* Contador de Respuestas (Caja Gris) */}
          <div style={{ background: "#D9D9D9", color: "#5A0E24", width: "90px", height: "80px", borderRadius: "10px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 0 rgba(0,0,0,0.1)" }}>
             <span style={{ fontSize: "2rem", fontWeight: "900", lineHeight: "1" }}>{answersCount}</span>
             <span style={{ fontSize: "0.7rem", fontWeight: "bold" }}>Respuestas</span>
          </div>

        </div>
        
        {/* COLUMNA CENTRAL: Pregunta */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <h2 style={{ 
            fontSize: isShowingResult ? "1.5rem" : "2.8rem", 
            textAlign: "center", 
            fontWeight: "800", 
            transition: "all 0.5s ease",
            margin: 0
          }}>
            {currentQ.question}
          </h2>
        </div>

        {/* COLUMNA DERECHA: Timer y Puntos */}
        <div style={{ 
  display: "flex", 
  flexDirection: "column", 
  gap: "20px", // Espacio entre elementos
  alignItems: "center", // Centra el botón respecto a los puntos
  justifyContent: "flex-start" 
}}>
          {/* Timer (Círculo Morado) */}
<div style={{ 
            background: (timeLeft !== null && timeLeft <= 5) ? "#FF1744" : "#574964", // <--- LÓGICA DEL COLOR
            transition: "background 0.3s ease", // <--- Transición suave
            color: "white", width: "90px", height: "90px", borderRadius: "50%", 
            display: "flex", alignItems: "center", justifyContent: "center", 
            fontSize: "2rem", fontWeight: "bold", border: "4px solid white", 
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)" 
          }}>
            {formatTime(timeLeft)}
          </div>

          {/* Puntos (Etiqueta Dorada) */}
          <div style={{ background: "#D8BC58", color: "white", padding: "10px 20px", borderRadius: "15px", fontWeight: "bold", textAlign: "center", minWidth: "90px" }}>
            <div style={{ fontSize: "1.3rem", lineHeight: "1" }}>{currentQ.points || 100}</div>
            <div style={{ fontSize: "1rem" }}>PUNTOS</div>
          </div>

{isShowingResult && (
      <button 
        onClick={handleNext} 
        style={{ 
          width: "55px", 
          height: "55px", 
          borderRadius: "50%", 
          background: "white", 
          color: "#5A0E24", 
          border: "none", 
          cursor: "pointer", 
          boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.5rem",
          transition: "transform 0.2s active"
        }}
      >
        ➡
      </button>
    )}
  </div>
</div>

      {/* --- ÁREA DE GRÁFICA (Solo aparece cuando isShowingResult es true) --- */}
      <div style={{ 
        flex: 1, 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "flex-end", 
        padding: "0 50px 20px 50px",
        opacity: isShowingResult ? 1 : 0,
        transform: isShowingResult ? "translateY(0)" : "translateY(20px)",
        transition: "all 0.5s ease"
      }}>

      {isShowingResult && (
          <div style={{ display: "flex", gap: "40px", alignItems: "stretch", height: "250px", width: "100%", maxWidth: "800px", position: "relative" }}>
            {stats.map((count, i) => {
                const barColors = ["#C6685D", "#A50E24", "#9195F6", "#574964"];
                const icons = ["▲", "◆", "●", "■"];
                
                const optionString = currentQ.options[i];
                let isCorrectBar = false;
                if (Array.isArray(currentQ.answer)) { isCorrectBar = currentQ.answer.includes(optionString); } 
                else { isCorrectBar = currentQ.answer === optionString; }

                const maxVal = Math.max(...stats, 1); 
                let heightPercent = (count / maxVal) * 100;
                
              return (
                  <div key={i} style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", gap: "5px" }}>
                    
                    <div style={{ width: "100%", flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center" }}>

                    {/* Número */}
                    <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#5A0E24", opacity: count > 0 ? 1 : 0.5, marginBottom: "8px" }}>
                        {count}
                      </div>
                      
                    {/* Barra */}
                    <div style={{ 
                      width: "100%", 
                      height: count > 0 ? `${heightPercent}%` : "5px", 
                      backgroundColor: barColors[i], 
                      borderRadius: "8px 8px 0 0",
                      transition: "height 0.8s ease",
                      opacity: count > 0 ? 1 : 0.2,
                      boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
                    }}></div>

                    </div>
                    
                   {/* Icono abajo + Palomita estilo Kahoot */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "5px", minHeight: "30px" }}>
                      {/* El ícono de la figura */}
                      <span style={{ fontSize: "1.5rem", color: barColors[i] }}>{icons[i]}</span>
                      
                      {/* La palomita verde redonda (Solo si es correcta) */}
                      {isCorrectBar && (
                        <div style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          backgroundColor: "#00E676", // Verde brillante estilo Kahoot
                          color: "white",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          fontSize: "1rem",
                          fontWeight: "bold",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                        }}>
                          ✓
                        </div>
                      )}
                      </div>
                  </div>
                )
             })}
          </div>
        )}
      </div>

     {/* OPCIONES (Se ocultan o se hacen pequeñas cuando mostramos la gráfica) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", padding: "20px", height: "300px", marginTop: "auto" }}>
          {currentQ.options.map((opt, i) => {
            const colors = ["#C6685D", "#A50E24", "#9195F6", "#574964"];
            const icons = ["▲", "◆", "●", "■"];
            
            let isCorrect = false;
          if (Array.isArray(currentQ.answer)) {
            isCorrect = currentQ.answer.includes(opt);
          } else {
            isCorrect = currentQ.answer === opt;
          }

          // --- LÓGICA VISUAL: Si estamos mostrando resultados y NO es la correcta, se atenúa ---
          const opacity = isShowingResult && !isCorrect ? 0.3 : 1;

            return (
              <div key={i} style={{ backgroundColor: colors[i % 4], opacity: opacity, borderRadius: "5px", display: "flex", alignItems: "center", padding: "0 30px", fontSize: "1.5rem", fontWeight: "600", color: "#FFFFFF", boxShadow: "0 4px 0 rgba(0,0,0,0.2)" }}>
                <span style={{ marginRight: "15px", fontSize: "1.8rem" }}>{icons[i % 4]}</span>
                {opt}

                {isShowingResult && isCorrect && (
                  <div style={{
                    marginLeft: "auto",
                    width: "40px",
                    height: "40px",
                    backgroundColor: "#00E676", // Verde brillante
                    borderRadius: "50%",        // Cuadradito redondeado
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "white",
                    fontSize: "1.8rem",
                    fontWeight: "bold",
                    boxShadow: "0 4px 0 #00B259" // El toque 3D en la parte de abajo
                  }}>
                    ✓
                  </div>
                )}
                </div>
            );
          })}
        </div>

      {/* MODAL DE CONFIRMACIÓN */}
      {showCancelModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          backgroundColor: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
        }}>
          <div style={{ background: "white", padding: "30px", borderRadius: "20px", textAlign: "center", maxWidth: "400px", animation: "popIn 0.3s" }}>
            <h2 style={{ color: "#5A0E24", margin: "0 0 10px 0" }}>¿Cancelar Juego?</h2>
            <p style={{ color: "#666", marginBottom: "20px" }}>Si sales ahora, terminará la partida para todos.</p>
            
            <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
              <button 
                onClick={() => setShowCancelModal(false)}
                style={{ padding: "10px 20px", borderRadius: "10px", border: "1px solid #ccc", background: "transparent", cursor: "pointer" }}
              >
                Continuar
              </button>
              <button 
                onClick={handleExitGame}
                style={{ padding: "10px 20px", borderRadius: "10px", border: "none", background: "#D32F2F", color: "white", fontWeight: "bold", cursor: "pointer" }}
              >
                Sí, Salir
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes popIn { from { transform: scale(0); } to { transform: scale(1); } }`}</style>
    </div>
  );
}