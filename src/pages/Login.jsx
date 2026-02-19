import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

// --- TUS IMÁGENES EXACTAS (Respetando mayúsculas y extensiones) ---
const BACKGROUNDS = [
  "Fondo5.jpeg", 
  "Fondo1.jpg", 
  "Fondo3.jpeg", 
  "Fondo4.jpeg", 
  "Fondo6.jpeg"
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  // --- NUEVO: Estado para controlar qué foto se ve ---
  const [bgIndex, setBgIndex] = useState(0);

  // --- NUEVO: Temporizador que cambia la foto cada 5 segundos ---
  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prevIndex) => (prevIndex + 1) % BACKGROUNDS.length);
    }, 4000); // 5000 = 5 segundos
    
    return () => clearInterval(interval); // Limpiamos al salir de la pantalla
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("https://cyraquiz.onrender.com/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userEmail", data.user.email);
        navigate("/host");
      } else {
        setError(data.error || "Credenciales incorrectas");
      }
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar con el servidor.");
    }
  };

  return (
    <div className="login-container" style={{ position: "relative", minHeight: "100vh", overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center" }}>
      
      {/* --- EL CARRUSEL DE FONDOS --- */}
      {BACKGROUNDS.map((bg, index) => (
        <div
          key={bg}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage: `url('/backgrounds/${bg}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: index === bgIndex ? 1 : 0, // Solo la foto actual es visible
            transition: "opacity 1.5s ease-in-out", // El efecto suave de cambio
            zIndex: 0
          }}
        />
      ))}

      {/* --- CAPA DE COLOR VINO TRANSPARENTE --- 
          (Para oscurecer un poquito las fotos y que la tarjeta blanca resalte más) */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(90, 14, 36, 0.4)", // Es tu color #5A0E24 con transparencia
        zIndex: 1
      }} />

      {/* --- TU CÓDIGO ORIGINAL INTACTO (Pero flotando encima del fondo) --- */}
      <div className="login-purple-box" style={{ position: "relative", zIndex: 2 }}>
        
        {/* TARJETA BLANCA (FORMULARIO) */}
        <div className="login-card">
          <h2 className="login-title">Hola de nuevo</h2>
          
          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label className="login-label">Correo Electrónico</label>
              <input 
                type="email" 
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                className="login-input"
              />
            </div>
<div className="input-group">
              <label className="login-label">Contraseña</label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  className="login-input"
                  style={{ width: "100%", paddingRight: "75px" }} // Da espacio para que el texto no tape lo que escribes
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ 
                    position: "absolute", 
                    right: "15px", 
                    background: "none", 
                    border: "none", 
                    cursor: "pointer", 
                    fontSize: "0.85rem", 
                    color: "#5A0E24", // Tu color vino
                    fontWeight: "700",
                    outline: "none"
                  }}
                  tabIndex="-1" 
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            <button type="submit" className="login-button">
              INGRESAR
            </button>
          </form>

          <p className="login-footer">
            ¿Aún no tienes cuenta?{" "}
            <Link to="/register" className="login-link">Regístrate</Link>
          </p>
        </div>

      </div>
    </div>
  );
}