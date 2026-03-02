import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

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
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prevIndex) => (prevIndex + 1) % BACKGROUNDS.length);
    }, 4000);
    
    return () => clearInterval(interval);
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
    <div className="login-container">

      {BACKGROUNDS.map((bg, index) => (
        <div
        key={bg}
          className="login-bg-image"
          style={{
            backgroundImage: `url('/backgrounds/${bg}')`,
            opacity: index === bgIndex ? 1 : 0,
          }}
        />
      ))}

      <div className="login-overlay"/>

      <div className="login-purple-box">
        
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
              <div className="password-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
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