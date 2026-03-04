import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { socket } from "../socket";
import "../styles/GameController.css";

export default function GameController() {
  const { pin } = useParams();
  const location = useLocation();
  const myName = location.state?.name || localStorage.getItem("join_name") || "Jugador";
  const navigate = useNavigate();
  const [gameState, setGameState] = useState("waiting");
  const [currentOptions, setCurrentOptions] = useState([]);
  const [questionType, setQuestionType] = useState("single");
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [resultData, setResultData] = useState({ isCorrect: false, pointsEarned: 0, totalScore: 0 });
  const [finalRank, setFinalRank] = useState(0);
  const [podiumStep, setPodiumStep] = useState(0);

  useEffect(() => {
    const onNewQuestion = (q) => {
      console.log("Nueva pregunta recibida:", q);
      setCurrentOptions(q.options);
      setQuestionType(q.type);
      setSelectedOptions([]);
      setGameState("answering");
    };

    const onAnswerResult = (result) => {
      console.log("Resultado secreto recibido:", result);
      setResultData(result);
    };

    const onRevealResults = () => {
      setGameState("result");
    };

    const onFinalResults = (sortedList) => {
      console.log("Juego terminado. Lista:", sortedList);
      
      const myIndex = sortedList.findIndex(p => p.name === myName);
      setFinalRank(myIndex + 1);

      if (myIndex !== -1) {
        setResultData(prev => ({ ...prev, myTime: sortedList[myIndex].timeAccumulated }));
      }

      const p1 = sortedList[0];
      const p2 = sortedList[1];
      const p3 = sortedList[2];
      const isTripleTie = p1 && p2 && p3 && p1.score === p2.score && p2.score === p3.score && p1.score > 0;
      const isDoubleTie = p1 && p2 && p1.score === p2.score && p1.score > 0;
      
      setGameState("game_over");

      if (isTripleTie) {
        //Triple empate
        setTimeout(() => setPodiumStep(3), 8000);
      } else if (isDoubleTie) {
        //Empate doble
        setTimeout(() => setPodiumStep(1), 3000);
        setTimeout(() => setPodiumStep(3), 8000);
      } else {
        //Sin empates
        setTimeout(() => setPodiumStep(1), 3000);
        setTimeout(() => setPodiumStep(2), 6000);
        setTimeout(() => setPodiumStep(3), 10000);
      }
    };

    const onGameCancelled = () => {
      alert("El profesor ha terminado la partida.");
      navigate("/join");
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

  const handleOptionClick = (option) => {
    if (questionType === "multi") {
      if (selectedOptions.includes(option)) {
        setSelectedOptions(prev => prev.filter(o => o !== option));
      } else {
        setSelectedOptions(prev => [...prev, option]);
      }
    } else {
      submitToServer(option);
    }
  };

  const handleMultiSubmit = () => {
    submitToServer(selectedOptions);
  };

  const submitToServer = (answerData) => {
    setGameState("submitted");
    socket.emit("submit_answer", { 
      roomCode: pin, 
      playerName: myName, 
      answer: answerData 
    });
  };

  if (gameState === "waiting") {
    return (
      <div className="screen-base screen-waiting">
        <div className="emoji-bounce">👀</div>
        <h2 className="screen-title">¡Atento a la pantalla!</h2>
        <p className="screen-subtitle">La pregunta está por salir...</p>
        <div className="player-tag">Jugador: {myName}</div>
      </div>
    );
  }

  if (gameState === "submitted") {
    return (
      <div className="screen-base screen-purple">
        <div className="emoji-fly">🚀</div>
        <h2 className="screen-title">Respuesta enviada...</h2>
      </div>
    );
  }

  if (gameState === "result") {
    const bg = resultData.isCorrect ? "#2E7D32" : "#C62828";
    const title = resultData.isCorrect ? "¡Correcto!" : "¡Incorrecto!";
    const circleBg = resultData.isCorrect ? "#00E676" : "#FF5252";
    const iconSymbol = resultData.isCorrect ? "✔" : "✖";
    
    return (
      <div className="screen-base" style={{ backgroundColor: bg }}>
        
        <div className="result-icon-circle" style={{ backgroundColor: circleBg }}>
          {iconSymbol}
        </div>

       <h1 className="result-title">{title}</h1>
        
        <div className="points-box">
          <p className="points-label">Puntos Ganados</p>
          <h3 className="points-value">+{resultData.pointsEarned}</h3>
        </div>

        <div className="total-score">
          Puntaje Total: {resultData.totalScore}
        </div>
      </div>
    );
  }

  if (gameState === "game_over") {

    let isWaiting = false;
    if (finalRank === 1 && podiumStep < 3) isWaiting = true;
    if (finalRank === 2 && podiumStep < 2) isWaiting = true;
    if (finalRank >= 3 && podiumStep < 1) isWaiting = true;

    if (isWaiting) {
      return (
        <div className="screen-base screen-drumroll">
          <div className="emoji-bounce" style={{ animationDuration: "0.4s" }}>🥁</div>
          <h2 className="screen-title">¡Calculando posiciones!</h2>
          <p className="screen-subtitle drumroll-subtitle">Voltea a la pantalla principal...</p>
        </div>
      );
    }
    
    let message = "¡Buen trabajo!";
    let bg = "#46178F";
    let medal = "";

    if (finalRank === 1) { 
      message = "¡CAMPEÓN!"; 
      bg = "#FFD700"; 
      medal = "👑";
    } else if (finalRank === 2) { 
      message = "¡Subcampeón!"; 
      bg = "#C0C0C0"; 
      medal = "🥈";
    } else if (finalRank === 3) { 
      message = "¡Tercer Lugar!"; 
      bg = "#CD7F32"; 
      medal = "🥉";
    } else if (finalRank <= 10) { 
      message = "¡Top 10!"; 
      bg = "#1565C0";
    }

    const textColor = finalRank === 1 ? "#5A0E24" : "white";

    return (
      <div className="screen-base" style={{ backgroundColor: bg, color: textColor }}>
        <div className="medal-icon">{medal}</div>
        <p className="rank-label">Quedaste en</p>
        <h1 className="rank-number">#{finalRank}</h1>
        <h2 className="rank-message">{message}</h2>
        
        <div className="final-stats-box" style={{ borderTop: `1px solid ${textColor}` }}>
          Puntaje Final: <strong>{resultData.totalScore} pts</strong>
          
          {resultData.myTime > 0 && (
            <div className="reaction-time">
              ⏱️ Tiempo de reacción: <strong>{(resultData.myTime / 1000).toFixed(2)}s</strong>
            </div>
          )}
        </div>

        <button 
          onClick={() => navigate("/join")}
          className="btn-exit-gameover"
          style={{
            backgroundColor: textColor === "white" ? "white" : "#5A0E24",
            color: textColor === "white" ? "#5A0E24" : "white"
          }}
        >
          Salir del Juego
        </button>
      </div>
    );
  }

  const colors = ["#EDA35A", "#851535", "#9195F6", "#574964"]; 
  const icons = ["🦖", "⭐", "🌸", "🌈"];

  return (
    <div className="play-area-wrapper">

      <div className="info-bar">
        {questionType === "multi" ? "Selecciona dos opciones" : "Selecciona una opción"}
      </div>

      <div className="buttons-grid">
        {currentOptions.map((opt, i) => {
          const isSelected = selectedOptions.includes(opt);
          const isDimmed = questionType === "multi" && selectedOptions.length > 0 && !isSelected;
          
          return (
            <button
              key={i}
              onClick={() => handleOptionClick(opt)}
              className={`answer-btn ${isSelected ? "selected" : ""} ${isDimmed ? "dimmed" : ""}`}
              style={{ backgroundColor: colors[i % 4] }}
            >
              {isSelected && <span className="multi-check-icon">✅</span>}
              
              <span className="answer-emoji">
                {icons[i % 4]}
              </span>
            </button>
          );
        })}
      </div>

      {questionType === "multi" && (
        <button 
          onClick={handleMultiSubmit}
          className="btn-multi-submit"
        >
          ENVIAR RESPUESTA
        </button>
      )}
    </div>
  );
}
