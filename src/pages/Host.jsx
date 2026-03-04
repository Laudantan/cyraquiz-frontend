import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Host.css";

export default function Host() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("userEmail") || "Profesor";
  const userName = userEmail.split("@")[0];
  const [hoveredQuiz, setHoveredQuiz] = useState(null);
  const [showModal, setShowModal] = useState(false); 
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isExtractMode, setIsExtractMode] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [myQuizzes, setMyQuizzes] = useState([]); 
  const [searchTerm, setSearchTerm] = useState("");
  const [quizToDelete, setQuizToDelete] = useState(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch("https://cyraquiz.onrender.com/quizzes", {
          headers: { token: token }
        });
        
        if (res.ok) {
          const data = await res.json();
          const formatted = data.map(q => ({
            id: q.id,
            title: q.title,
            date: new Date(q.created_at).toLocaleDateString(),
            questions: q.questions, 
            totalQuestions: q.questions.length
          }));
          setMyQuizzes(formatted);
        }
      } catch (err) {
        console.error("Error cargando quizzes:", err);
      }
    };

    fetchQuizzes();
  }, []);

  const filteredQuizzes = myQuizzes.filter(quiz => 
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === "application/pdf") {
      setFile(selected);
    } else {
      alert("Por favor sube un archivo PDF válido.");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFile(null);
    setSuccessData(null);
    setIsExtractMode(false); 
   };

const handleUpload = async () => {
    if (!file) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("casillaMarcada", isExtractMode);
      formData.append("pdfFile", file);
      
      const response = await fetch("https://cyraquiz.onrender.com/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const newQuiz = {
          id: Date.now(),
          title: file.name.replace(".pdf", ""),
          date: new Date().toLocaleDateString(),
          questions: data.questions,
          questionsData: data.questions.length
        };
        setMyQuizzes([...myQuizzes, newQuiz]);
        setSuccessData(newQuiz);
        
      } else {
        alert("Error: " + (data.error || "Fallo en el servidor"));
      }

    } catch (error) {
      console.error(error);
      alert("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const executeDelete = async () => {
    if (!quizToDelete) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`https://cyraquiz.onrender.com/quizzes/${quizToDelete}`, {
        method: "DELETE",
        headers: { token: token }
      });

      if (res.ok) {
        setMyQuizzes(myQuizzes.filter(q => q.id !== quizToDelete));
        setQuizToDelete(null);
      } else {
        alert("Error al eliminar el examen.");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión.");
    }
  };

  return (
    <div className="host-container">
      
      <nav className="host-navbar">
        <div className="navbar-logo-group">
          <h2 className="navbar-brand">CYRAQuiz</h2>
        </div>

        <div className="navbar-user-group">
            <span className="navbar-greeting">Hola, {userEmail}</span>
            <button 
                onClick={handleLogout} 
                className="btn-logout"
            >
            Salir
            </button>
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '25px auto', padding: "0 20px" }}>
        
        <div className="dashboard-header">
          
          <div className="dashboard-title-group">
            <h1 className="dashboard-title">Mis exámenes</h1>
            <p className="dashboard-subtitle">Tienes <strong>{myQuizzes.length} exámenes</strong> listos.</p>
          </div>

          <div className="dashboard-actions">
            <div className="search-wrapper">
              <input 
                type="text" 
                placeholder="Buscar examen..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <button 
              onClick={() => setShowModal(true)}
              className="btn-create-glow"
            >
              + CREAR QUIZ
            </button>
          </div>
        </div>

        <div className="quizzes-grid">
          
          {filteredQuizzes.length === 0 ? (
             <div className="empty-state-container">
                <span className="empty-state-icon">📄</span>
                <p className="empty-state-text">
                  {searchTerm ? "No encontramos exámenes con ese nombre." : "Tu biblioteca está vacía. ¡Crea el primero!"}
                </p>
             </div>
          ) : (
            filteredQuizzes.map((quiz, index) => {
              const stripeColors = ["#96A78D", "#D8E983", "#B6CEB4", "#AEB877"];
              const myColor = stripeColors[index % stripeColors.length];
              const isHovered = hoveredQuiz === quiz.id;

              return (
                <div 
                  key={quiz.id} 
                  onMouseEnter={() => setHoveredQuiz(quiz.id)}
                  onMouseLeave={() => setHoveredQuiz(null)}
                  onClick={() => navigate(`/edit/${quiz.id}`, { state: { quizData: quiz } })}
                  className="quiz-card"
                  style={{
                    boxShadow: isHovered ? '0 15px 35px rgba(0,0,0,0.1)' : '0 4px 10px rgba(0,0,0,0.05)',
                    transform: isHovered ? 'translateY(-8px)' : 'none'
                  }}
                >
                  <div className="quiz-card-stripe" style={{ backgroundColor: myColor }}></div>

                  <div className="quiz-card-content">
                    <div className="quiz-card-icon" style={{ 
                      backgroundColor: `${myColor}20`, 
                      color: myColor 
                    }}>
                      📝
                    </div>

                    <h3 className="quiz-card-title">
                      {quiz.title}
                    </h3>
                    
                    <div className="quiz-card-footer">
                      <span className="quiz-card-questions">
                        {quiz.totalQuestions} Preguntas
                      </span>
                      <span className="quiz-card-date">
                        {quiz.date}
                      </span>
                    </div>
                  </div>

                  <div className="quiz-card-overlay" style={{ opacity: isHovered ? 1 : 0 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); 
                        navigate(`/room/${quiz.id}`, { state: { quizData: quiz } });
                      }}
                      className="btn-play-hover"
                    >
                      ▶ JUGAR
                    </button>

                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setQuizToDelete(quiz.id);
                      }}
                      className="btn-delete-hover"
                    >
                      ELIMINAR
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL PRINCIPAL */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
        
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            
            <button onClick={closeModal} className="modal-close-btn">✕</button>
            
            {!successData ? (
              // VISTA 1: SUBIR DOCUMENTO
              <>
                <h2 className="modal-title">Subir Documento</h2>

                {!file ? (
                  <div className="upload-box">
                    <input type="file" id="pdf-upload" accept="application/pdf" onChange={handleFileChange} className="hidden-file-input"/>
                    <label htmlFor="pdf-upload" className="upload-label">
                       <span className="upload-icon">📂</span>
                       <span className="upload-text">Clic para subir PDF</span>
                    </label>
                  </div>
                ) : (
                  <div className="file-selected-box">
                    <span className="file-icon">📄</span>
                    <span className="file-name">{file.name}</span>
                  </div>
                )}

                <div className="checkbox-group">
                  <input 
                    type="checkbox" 
                    id="extractCheckbox" 
                    checked={isExtractMode}
                    onChange={(e) => setIsExtractMode(e.target.checked)}
                    className="extract-checkbox"
                  />
                  <label htmlFor="extractCheckbox" className="extract-label">
                    El PDF ya contiene preguntas
                  </label>
                </div>

                <button 
                  onClick={handleUpload}
                  disabled={!file || loading}
                  className="btn-generate"
                >
                  {loading ? (
                    <span style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
                      Generando...
                    </span>
                  ) : "GENERAR PREGUNTAS"}
                </button>
              </>
            ) : (
              // VISTA 2: ÉXITO
              <div className="success-view-container">
                <div className="success-icon-bounce">🎉</div>
                <h2 className="success-title">
                  ¡Examen Listo!
                </h2>
                <p className="success-message-text">
                  Se generaron preguntas sobre "{successData.title}".
                </p>

                <div className="modal-actions">
                  <button onClick={closeModal} className="btn-modal-secondary">Cerrar</button>
                  <button 
                    onClick={() => navigate(`/edit/${successData.id}`, { state: { quizData: successData } })}
                    className="btn-modal-primary"
                  >
                    Editar y Guardar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL DE CONFIRMACIÓN DE BORRADO --- */}
      {quizToDelete && (
        <div className="delete-modal-overlay" onClick={() => setQuizToDelete(null)}>
          
          <div className="delete-modal-content" onClick={(e) => e.stopPropagation()}>
            
            <h2 className="delete-modal-title">¿Eliminar examen?</h2>
            <p className="delete-modal-text">
              Esta acción no se puede deshacer.
            </p>

            <div className="delete-modal-actions">
              <button 
                onClick={() => setQuizToDelete(null)} 
                className="btn-modal-secondary-pro"
              >
                Cancelar
              </button>

              <button 
                onClick={executeDelete} 
                className="btn-modal-danger-pro"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// TUS CONSTANTES (Se quedan aquí abajo sin borrar)
const rowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#F9F9F9', borderRadius: '10px' };
const counterBtnStyle = { width: '30px', height: '30px', borderRadius: '50%', border: '1px solid #ccc', background: 'white', cursor: 'pointer', fontWeight: 'bold', color: '#5A0E24' };
const countStyle = { width: '20px', textAlign: 'center', fontWeight: 'bold' };