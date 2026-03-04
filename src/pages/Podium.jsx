import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { socket } from "../socket";
import confetti from "canvas-confetti";
import useSound from "use-sound";
import "../styles/Podium.css";

export default function Podium() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [sortedPlayers, setSortedPlayers] = useState([]);
  const [first, setFirst] = useState(null);
  const [second, setSecond] = useState(null);
  const [third, setThird] = useState(null);
  const [step, setStep] = useState(0);
  const [isTie, setIsTie] = useState(false);
  const [tieMessage, setTieMessage] = useState("");
  const [isTripleTie, setIsTripleTie] = useState(false);
  const [playDrumroll, { pause: pauseDrumroll, stop: stopDrumroll }] = useSound("/redoble.mp3", { loop: true, volume: 0.5 });
  const [playThird] = useSound("/tercer.mp3", { volume: 0.7 });
  const [playSecond] = useSound("/segundo.mp3", { volume: 0.7 });
  const [playVictory1, { stop: stopVictory1 }] = useSound("/win.mp3", { volume: 0.7 });
  const [playVictory2, { stop: stopVictory2 }] = useSound("/aplauso.wav", { volume: 0.7 });

  useEffect(() => {
    return () => {
      stopDrumroll();
      stopVictory1();
      stopVictory2();
    };
  }, [stopDrumroll, stopVictory1, stopVictory2]);
  
  useEffect(() => {
    console.log("Cargando podio... Pidiendo resultados finales.");

    socket.emit("game_over", roomCode);
    socket.on("final_results", (results) => {
      console.log("Resultados recibidos:", results);
      
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
      const isDoubleTieCheck = p1 && p2 && p1.score === p2.score && p1.score > 0;

      if (isTripleTieCheck) {
        tieDetected = true;
        tieText = "⚡ ¡INCREÍBLE! ¡TRIPLE EMPATE EN LA CIMA! ⚡";
        setIsTripleTie(true);
      } else if (isDoubleTieCheck) {
        tieDetected = true;
        tieText = "⚡ ¡Empate de puntos detectado! ⚡";
        setIsTripleTie(false);
      } else {
        setIsTripleTie(false);
      }

      setIsTie(tieDetected);
      setTieMessage(tieText);
      startAnimation(tieDetected);
    });

    return () => {
      socket.off("final_results");
    };
  }, []);

    const startAnimation = (tieDetected) => {
    setTimeout(() => setStep(1), 3000);  // Muestra 3ro

    if (tieDetected) {
      // Empate
      setTimeout(() => setStep(1.5), 5000);
      
      // Revela 2do lugar y 1er lugar
      setTimeout(() => {
        setStep(3); 
        triggerConfetti();
      }, 8000);
    } else {
      // Flujo normal sin empate
      setTimeout(() => setStep(2), 6000); // Muestra 2do
      setTimeout(() => {
        setStep(3);
        triggerConfetti();
      }, 10000); // Muestra 1ro
    }
  };

  useEffect(() => {
    if (step === 0) {
      playDrumroll();
    } 
    else if (step === 1) {
      // 3er Lugar
      pauseDrumroll();
      playThird();
      setTimeout(() => playDrumroll(), 2000);
    } 
    else if (step === 1.5) {
      // Empate
    } 
    else if (step === 2) {
      // 2do Lugar
      pauseDrumroll();
      playSecond();
      setTimeout(() => playDrumroll(), 2000);
    } 
    else if (step === 3) {
      // 1er Lugar
      stopDrumroll();
      playVictory1();
      playVictory2();
    }
  }, [step, playDrumroll, pauseDrumroll, stopDrumroll, playThird, playSecond, playVictory1, playVictory2]);

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
    <div className="podium-wrapper">
      
      <div className="stage-light light-left"></div>
      <div className="stage-light light-right"></div>

      <div className="neon-title-wrapper">
        <h1 className="neon-title-text">
          ¡GANADORES!
        </h1>
      </div>

      {step === 1.5 && isTie && (
        <div className="tie-alert-box">
          {tieMessage} <br/>
          <span className="tie-alert-subtext">
            Resolviendo posiciones por velocidad de respuesta...
          </span>
        </div>
      )}

      {/* ZONA DEL PODIO */}
     <div className="podium-zone">

        {/* SEGUNDO LUGAR */}
        <div 
          className="podium-column column-second" 
          style={{ 
            opacity: step >= 2 ? 1 : 0, 
            transform: step >= 2 ? "translateY(0)" : "translateY(50px)" 
          }}
        >
          {second && (
            <>
              <div className="player-info-wrapper">
                <div className="avatar-container">
                  <img src={second.avatar} alt="avatar" className="avatar-img avatar-silver" />
                  <div className="medal-badge medal-silver">🥈</div>
                </div>
                <div className="player-name-podium">{second.name}</div>
                <div className="player-stats-podium">
                  <div className="stat-col"><strong className="stat-val">{second.score}</strong> <span className="stat-label">PTS</span></div>
                  <span className="stat-divider">|</span>
                  <div className="stat-col"><strong className="stat-val">{(second.timeAccumulated / 1000).toFixed(2)}</strong> <span className="stat-label">TIEMPO</span></div>
                </div>
              </div>

              <div className="podium-cylinder cylinder-second">
                <div className="cylinder-top top-second"></div>
                <span className="cylinder-text text-second">2DO LUGAR</span>
              </div>
            </>
          )}
        </div>

        {/* PRIMER LUGAR */}
        <div 
          className="podium-column column-first" 
          style={{ 
            opacity: step >= 3 ? 1 : 0, 
            transform: step >= 3 ? "scale(1)" : "scale(0.5)" 
          }}
        >
          {first && (
            <>
              <div className="player-info-wrapper info-first">
                <span className="crown-icon">👑</span>
                <div className="avatar-container">
                  <img src={first.avatar} alt="avatar" className="avatar-img avatar-gold" />
                  <div className="medal-badge medal-gold">🥇</div>
                </div>
                <div className="player-name-podium name-gold">{first.name}</div>
                <div className="player-stats-podium stats-gold">
                  <div className="stat-col"><strong className="stat-val gold-val">{first.score}</strong> <span className="stat-label">PTS</span></div>
                  <span className="stat-divider">|</span>
                  <div className="stat-col"><strong className="stat-val gold-val">{(first.timeAccumulated / 1000).toFixed(2)}</strong> <span className="stat-label">TIEMPO</span></div>
                </div>
              </div>

              <div className="podium-cylinder cylinder-first">
                 <div className="cylinder-top top-first"></div>
                  <span className="cylinder-text text-first">1ER LUGAR</span>
              </div>
            </>
          )}
        </div>

        {/* TERCER LUGAR */}
        <div 
          className="podium-column column-third" 
          style={{ 
            opacity: (step >= 1 && !isTripleTie) || step >= 3 ? 1 : 0, 
            transform: (step >= 1 && !isTripleTie) || step >= 3 ? "translateY(0)" : "translateY(50px)" 
          }}
        >
          {third && (
            <>
               <div className="player-info-wrapper">
                <div className="avatar-container">
                  <img src={third.avatar} alt="avatar" className="avatar-img avatar-bronze" />
                  <div className="medal-badge medal-bronze">🥉</div>
                </div>
                <div className="player-name-podium">{third.name}</div>
                <div className="player-stats-podium">
                  <div className="stat-col"><strong className="stat-val">{third.score}</strong> <span className="stat-label">PTS</span></div>
                  <span className="stat-divider">|</span>
                  <div className="stat-col"><strong className="stat-val">{(third.timeAccumulated / 1000).toFixed(2)}</strong> <span className="stat-label">TIEMPO</span></div>
                </div>
              </div>

             <div className="podium-cylinder cylinder-third">
                <div className="cylinder-top top-third"></div>
                <span className="cylinder-text text-third">3ER LUGAR</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* RESULTADOS */}
      <div className="leaderboard-decor decor-back"></div>
      <div className="leaderboard-decor decor-front"></div>

      <div className="leaderboard-container">
        <h3 className="leaderboard-title">
          RESULTADOS GENERALES
        </h3>
        
        <div className="leaderboard-header">
          <div className="col-rank">Rango</div>
          <div className="col-name">Nombre del Jugador</div>
          <div className="col-score">Puntuación</div>
        </div>
        
        <div className="leaderboard-divider"></div>

        {sortedPlayers.slice(3).map((p, index) => (
          <div key={index} className={`leaderboard-row ${index % 2 === 0 ? "row-even" : ""}`}>
            <div className="row-rank">
              {index + 4}
            </div>
            <div className="row-name">
              <img src={p.avatar} alt="av" className="row-avatar" />
              <span className="row-player-name">{p.name}</span>
            </div>
            <div className="row-score">{p.score} pts</div>
            <div className="row-time">{(p.timeAccumulated / 1000).toFixed(2)}s</div>
          </div>
        ))}

        {sortedPlayers.length <= 3 && (
          <div className="leaderboard-empty">
            No hay más jugadores para mostrar
          </div>
        )}
      </div>

      {step === 3 && (
        <button 
          onClick={() => navigate("/host")} 
          className="btn-return-lobby"
        >
          VOLVER AL LOBBY
        </button>
      )}
    </div>
  );
}