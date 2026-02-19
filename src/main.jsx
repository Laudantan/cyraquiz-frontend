import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// 1. IMPORTAMOS TUS ESTILOS GLOBALES
import "./styles/variables.css"; 
import "./index.css"; 

// 2. IMPORTAMOS TUS PÁGINAS
import Register from "./pages/Register.jsx";
import EditQuiz from "./pages/EditQuiz.jsx";
import GameRoom from "./pages/GameRoom.jsx";
import HostGame from "./pages/HostGame.jsx";
import GameController from "./pages/GameController.jsx";
import Podium from "./pages/Podium.jsx";
import Host from "./pages/Host.jsx";
import Join from "./pages/Join.jsx";
import Login from "./pages/Login.jsx"; 
import StudentLobby from "./pages/StudentLobby.jsx";

// 3. IMPORTAMOS EL SOCKET
import { socket } from "./socket";

// Conectamos el socket una sola vez al iniciar la app
socket.connect();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* --- AQUÍ ESTÁ EL TRUCO --- */}
        {/* Si entran a la raíz (tupagina.com), los mandamos directo al LOGIN del profesor */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Rutas Públicas */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        
        {/* Ruta para el Alumno (tupagina.com/join) */}
        <Route path="/join" element={<Join />} />

        {/* Rutas Privadas / Del Juego */}
        <Route path="/host" element={<Host />} />
        <Route path="/student/lobby/:pin" element={<StudentLobby />} />
        <Route path="/edit/:id" element={<EditQuiz />} />
        <Route path="/room/:id" element={<GameRoom />} />
        <Route path="/host-game/:roomCode" element={<HostGame />} />
        <Route path="/game/:pin" element={<GameController />} />
        <Route path="/podium/:roomCode" element={<Podium />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);