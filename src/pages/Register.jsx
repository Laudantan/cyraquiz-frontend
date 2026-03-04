import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

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
  const [successMsg, setSuccessMsg] = useState(""); 
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    setSuccessMsg("");

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
        setSuccessMsg("¡Registro exitoso! Por favor revisa tu bandeja de entrada (y SPAM) para confirmar tu correo. Serás redirigido...");
        
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
    <div className="login-container">
      
      {BACKGROUNDS.map((bg, index) => (
        <div
          key={bg}
          className="login-bg-image"
          style={{
            backgroundImage: `url('/backgrounds/${bg}')`,
            opacity: index === bgIndex ? 1 : 0
          }}
        />
      ))}

      <div className="login-overlay"/>

      <div className="login-purple-box">
        <div className="login-card">
          <h2 className="login-title">Crear Cuenta</h2>

          {error && <div className="login-error">{error}</div>}
          {successMsg && <div className="success-message">{successMsg}</div>}

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

           <div className="input-group">
              <label className="login-label">Contraseña</label>
              <div className="password-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Mínimo 6 caracteres" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  className="login-input password-input" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="toggle-password-btn"
                  tabIndex="-1"
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="login-label">Confirmar Contraseña</label>
              <div className="password-wrapper">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="Repite tu contraseña" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required 
                  className="login-input password-input"
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="toggle-password-btn"
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