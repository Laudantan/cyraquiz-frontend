import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { socket } from "../socket";
import useSound from "use-sound";
import "../styles/HostGame.css";

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
  const [playCountdown, { stop: stopCountdown }] = useSound("/countdown.wav", { volume: 0.6 });

  const [playQuestionMusic, { stop: stopQuestionMusic }] = useSound("/question.mp3", { 
    volume: 0.4, 
    loop: true // Lo ponemos en bucle por si la pregunta dura mucho
  });

  const [playResultSound] = useSound("/result.mp3", { volume: 0.7 });

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

    if (startCountdown === 3) {
      playCountdown();
    }

    if (startCountdown >= 0) {
      const timer = setTimeout(() => setStartCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }

    else if (startCountdown === -1) {
      stopCountdown();
    }
  }, [startCountdown, playCountdown, stopCountdown]);

  useEffect(() => {
      // Si ya pasamos el "¡VAMOS!" (< 0) y TODAVÍA NO se muestran los resultados...
      if (startCountdown < 0 && !isShowingResult) {
        playQuestionMusic();
      } else {
        // En el instante en que isShowingResult se vuelva true (porque se acabó el tiempo o todos respondieron), se apaga.
        stopQuestionMusic();
      }

      // Freno de mano por si el profesor le da a "Salir" a la mitad de la pregunta
      return () => {
        stopQuestionMusic();
      };
    }, [startCountdown, isShowingResult, playQuestionMusic, stopQuestionMusic]);

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
      playResultSound(); 
    }
  }, [isShowingResult, roomCode, playResultSound]);

  // LOGICA DE PREGUNTA NUEVA
  useEffect(() => {
    if (startCountdown !== -1 || !currentQ) return;

    console.log(`Enviando Pregunta ${currentQuestionIndex + 1}:`, currentQ.question);

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
  }, [currentQuestionIndex, startCountdown, roomCode, currentQ]); 

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

  if (!currentQ) return <div className="hostgame-loading">Cargando pregunta...</div>;

  // --- VISTA: CUENTA REGRESIVA 3..2..1 ---
  if (startCountdown >= 0) {
    return (
      <div className="countdown-container">
        <h2 className="countdown-title">¿Listos?</h2>
        <div key={startCountdown} 
          className="countdown-number"
          style={{ fontSize: startCountdown === 0 ? "7rem" : "10rem" }}
          >
          {startCountdown === 0 ? "¡VAMOS!" : startCountdown}
        </div>
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

  return (
    <div className="hostgame-wrapper">

     <div className="hostgame-header"> 

        <button 
          onClick={() => setShowCancelModal(true)}
          className="btn-exit-game">
          <span>←</span> Salir
        </button>

        <div className="header-center-stats">
          <div>
            <div className="stat-label">PROGRESO</div>
            <div className="stat-number">{currentQuestionIndex + 1}/{questionsList.length}</div>
          </div>
          <div>
            <div className="stat-label">RESPUESTAS</div>
            <div className="stat-number">{answersCount}</div>
          </div>
        </div>

        <div className="header-right-group">

          <div className="capsule-border">
            <div className="capsule-inner">
              
              <div className="stat-section">
                <div className="stat-header-group">
                  <div className="stat-icon-time">⏱</div>
                  <div className="stat-text-col">
                    <div className="stat-title-small">TIEMPO</div>
                    <div className="stat-value-big"
                      style={{ color: (timeLeft !== null && timeLeft <= 10) ? "#D32F2F" : "#1E293B"}}>
                      {formatTime(timeLeft)}
                    </div>
                  </div>
                </div>
                <div className="stat-bar-bg">
                  <div className="stat-bar-fill time-bar-anim" 
                    style={{ width: `${timeLeft !== null ? (timeLeft / (currentQ.time || 20)) * 100 : 100}%`}}>
                  </div>
                </div>
              </div>

              <div className="capsule-separator"></div>
              
              <div className="stat-section">
                <div className="stat-header-group">
                  <div className="stat-icon-points">🏆</div>
                  <div className="stat-text-col">
                    <div className="stat-title-small">PUNTOS</div>
                    <div className="stat-value-big">{currentQ.points || 100}</div>
                  </div>
                </div>
                <div className="stat-bar-bg">
                  <div className="stat-bar-fill" style={{ width: "100%" }}></div>
                </div>
              </div>

            </div>
          </div>

          {isShowingResult && (
            <button onClick={handleNext} className="btn-next-question">
              Siguiente
            </button>
          )}
        </div>
      </div>
        
      <div className={`question-wrapper ${isShowingResult ? 'showing-results' : ''}`}>
        <h2 className="question-text">
          {currentQ.question}
        </h2>
      </div>

      <div className={`chart-area ${isShowingResult ? 'showing-results' : ''}`}>
        {isShowingResult && (
          <div className="chart-container">
            {stats.map((count, i) => {
                const barColors = ["#EDA35A", "#A50E24", "#9195F6", "#574964"];
                const icons = ["🦖", "⭐", "🌸", "🌈"];
                
                const optionString = currentQ.options[i];
                let isCorrectBar = false;
                if (Array.isArray(currentQ.answer)) { isCorrectBar = currentQ.answer.includes(optionString); } 
                else { isCorrectBar = currentQ.answer === optionString; }

                const maxVal = Math.max(...stats, 1); 
                let heightPercent = (count / maxVal) * 100;
                
              return (
                  <div key={i} className="chart-column">
                    
                    <div className="bar-wrapper">

                      <div 
                        className="bar-count"
                        style={{ opacity: count > 0 ? 1 : 0.5 }}
                        >
                        {count}
                      </div>
                      
                     <div 
                        className="bar-fill"
                        style={{ 
                          height: count > 0 ? `${heightPercent}%` : "8px", 
                          backgroundColor: barColors[i], 
                          opacity: count > 0 ? 1 : 0.3,
                          boxShadow: count > 0 ? "0 4px 10px rgba(0,0,0,0.15)" : "none"
                        }}
                      ></div>
                    </div>
                    
                    <div className="bar-footer">
                      <span className="bar-icon">{icons[i]}</span>

                      {isCorrectBar && (
                        <div className="correct-checkmark">✓</div>
                      )}
                    </div>
                  </div>
                )
             })}
          </div>
        )}
      </div>

      <div className={`options-grid ${isShowingResult ? 'showing-results' : ''}`}>
        {currentQ.options.map((opt, i) => {
          const backgrounds = ["#EDA35A", "#A50E24", "#9195F6", "#574964"];
          const shadowColors = ["#C68848", "#7D0A1B", "#7579CA", "#3E3447"];
          const icons = ["🦖", "⭐", "🌸", "🌈"];
          
          let isCorrect = false;
          if (Array.isArray(currentQ.answer)) {
            isCorrect = currentQ.answer.includes(opt);
          } else {
            isCorrect = currentQ.answer === opt;
          }

          const opacity = isShowingResult && !isCorrect ? 0.4 : 1;

          return (
            <div 
              key={i} 
              className="option-card"
              style={{ 
                background: backgrounds[i % 4], 
                opacity: opacity, 
                boxShadow: `0 6px 0 ${shadowColors[i % 4]}, 0 10px 20px rgba(0,0,0,0.15)`, 
                transform: isShowingResult ? "scale(0.98)" : "scale(1)" 
              }}
            >
              <span className="option-icon">
                {icons[i % 4]}
              </span>
              <span className="option-text">{opt}</span>

              {isShowingResult && isCorrect && (
                <div className="option-correct-check">✓</div>
              )}
            </div>
          );
        })}
      </div>

      {showCancelModal && (
        <div className="cancel-modal-overlay">
          <div className="cancel-modal-content">
            <h2 className="cancel-title">¿Cancelar Juego?</h2>
            <p className="cancel-text">Si sales ahora, terminará la partida para todos.</p>
            
            <div className="cancel-actions">
              <button 
                onClick={() => setShowCancelModal(false)}
                className="btn-cancel-continue"
              >
                Continuar
              </button>
              <button 
                onClick={handleExitGame}
                className="btn-cancel-exit"
              >
                Sí, Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}