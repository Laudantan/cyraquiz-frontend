import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

// --- LAS MISMAS IMÁGENES DEL LOGIN ---
const BACKGROUNDS = [
  "Fondo5.jpeg", 
  "Fondo1.jpg", 
  "Fondo3.jpeg", 
  "Fondo4.jpeg", 
  "Fondo6.jpeg"
];

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState(""); // <-- NUEVO: Mensaje de confirmación
  const navigate = useNavigate();

  // --- NUEVO: Estados para ver/ocultar contraseñas ---
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // --- NUEVO: Estado y Timer para el fondo dinámico ---
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prevIndex) => (prevIndex + 1) % BACKGROUNDS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg(""); // Limpiamos mensajes anteriores

    // Validaciones básicas
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      const response = await fetch("https://cyraquiz.onrender.com/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // --- NUEVO: Le pedimos que vaya a su correo en lugar de mandarlo de golpe ---
        setSuccessMsg("¡Registro exitoso! Por favor revisa tu bandeja de entrada (y SPAM) para confirmar tu correo. Serás redirigido...");
        
        // Esperamos 6 segundos para que lea el mensaje y luego lo mandamos al Login
        setTimeout(() => {
          navigate("/login"); 
        }, 6000);
        
      } else {
        setError(data.error || "Error al registrar usuario");
      }
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar con el servidor.");
    }
  };

  return (
    <div className="login-container" style={{ position: "relative", minHeight: "100vh", overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center" }}>
      
      {/* --- CARRUSEL DE FONDOS --- */}
      {BACKGROUNDS.map((bg, index) => (
        <div
          key={bg}
          style={{
            position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
            backgroundImage: `url('/backgrounds/${bg}')`,
            backgroundSize: "cover", backgroundPosition: "center",
            opacity: index === bgIndex ? 1 : 0, transition: "opacity 1.5s ease-in-out", zIndex: 0
          }}
        />
      ))}

      {/* --- CAPA DE COLOR VINO TRANSPARENTE --- */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(90, 14, 36, 0.4)", zIndex: 1 }} />

      <div className="login-purple-box" style={{ position: "relative", zIndex: 2 }}>
        <div className="login-card">
          <h2 className="login-title">Crear Cuenta 🚀</h2>
          
          {/* Muestra errores en rojo o el mensaje de éxito en verde */}
          {error && <div className="login-error" style={{ color: "red", fontWeight: "bold", textAlign: "center", marginBottom: "10px" }}>{error}</div>}
          {successMsg && <div style={{ color: "#2E7D32", fontWeight: "bold", textAlign: "center", marginBottom: "15px", backgroundColor: "#E8F5E9", padding: "15px", borderRadius: "10px", fontSize: "0.95rem" }}>{successMsg}</div>}

          <form onSubmit={handleRegister}>
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

            {/* --- CONTRASEÑA CON OJITO --- */}
           <div className="input-group">
              <label className="login-label">Contraseña</label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Mínimo 6 caracteres" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  className="login-input"
                  style={{ width: "100%", paddingRight: "75px" }} 
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
                    color: "#5A0E24", 
                    fontWeight: "700",
                    outline: "none"
                  }}
                  tabIndex="-1"
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            {/* --- CONFIRMAR CONTRASEÑA (Estilo Texto) --- */}
            <div className="input-group">
              <label className="login-label">Confirmar Contraseña</label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="Repite tu contraseña" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required 
                  className="login-input"
                  style={{ width: "100%", paddingRight: "75px" }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ 
                    position: "absolute", 
                    right: "15px", 
                    background: "none", 
                    border: "none", 
                    cursor: "pointer", 
                    fontSize: "0.85rem", 
                    color: "#5A0E24", 
                    fontWeight: "700",
                    outline: "none"
                  }}
                  tabIndex="-1"
                >
                  {showConfirmPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            <button type="submit" className="login-button">
              REGISTRARSE
            </button>
          </form>

          <p className="login-footer">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="login-link">Inicia sesión aquí</Link>
          </p>
        </div>
      </div>
    </div>
  );
}