import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Host() {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("userEmail") || "Profesor";
  const userName = userEmail.split("@")[0];
  
  // --- ESTADOS ---
  const [hoveredQuiz, setHoveredQuiz] = useState(null);
  const [showModal, setShowModal] = useState(false); 
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // NUEVO: Estado para guardar el ID del quiz recién creado y mostrar la pantalla de éxito
  const [successData, setSuccessData] = useState(null);

const [myQuizzes, setMyQuizzes] = useState([]); 
const [searchTerm, setSearchTerm] = useState("");
const [quizToDelete, setQuizToDelete] = useState(null);

  // AGREGAR ESTO: Cargar exámenes reales al entrar
  useEffect(() => {
    const fetchQuizzes = async () => {
      const token = localStorage.getItem("token");
      if (!token) return; // Si no hay login, no cargamos nada

      try {
        const res = await fetch("https://cyraquiz.onrender.com/quizzes", {
          headers: { token: token }
        });
        
        if (res.ok) {
          const data = await res.json();
          // Mapeamos los datos para que coincidan con tu diseño visual
          const formatted = data.map(q => ({
            id: q.id,
            title: q.title,
            date: new Date(q.created_at).toLocaleDateString(),
            questions: q.questions, // <--- CORRECTO: Guardamos la lista real
            totalQuestions: q.questions.length // <--- Guardamos el número aparte
          }));
          setMyQuizzes(formatted);
        }
      } catch (err) {
        console.error("Error cargando quizzes:", err);
      }
    };

    fetchQuizzes();
  }, []);

  // --- FILTRO DE BÚSQUEDA ---
  const filteredQuizzes = myQuizzes.filter(quiz => 
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- FUNCIONES ---
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

  // Resetea todo al cerrar el modal
  const closeModal = () => {
    setShowModal(false);
    setFile(null);
    setSuccessData(null); // Limpiamos el éxito para la próxima
   };

const handleUpload = async () => {
    if (!file) return;

    setLoading(true);

    try {
      const formData = new FormData();
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
          questionsData: data.questions.length // Guardamos cuántas se generaron
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
        setQuizToDelete(null); // Cerramos el modal
      } else {
        alert("Error al eliminar el examen.");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa", fontFamily: "'Poppins', 'Monserrat" }}>
      
      {/* --- NAVBAR COLOR VINO (Recuperada) --- */}
      <nav style={{ 
        background: "#5A0E24", // <--- TU COLOR VINO
        padding: "15px 40px", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
        color: "white"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h2 style={{ margin: 0, fontWeight: 800, letterSpacing: "0px" }}>CYRAQuiz</h2>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            {/* Usamos userEmail si userName no está definido */}
            <span style={{ fontWeight: "500", opacity: 0.9 }}>Hola, {userEmail}</span>
            <button 
                onClick={handleLogout} 
                style={{ 
                    background: "rgba(255,255,255,0.15)", 
                    border: "1px solid rgba(255,255,255,0.5)", 
                    padding: "8px 20px", 
                    borderRadius: "20px", 
                    cursor: "pointer", 
                    fontWeight: "600", 
                    color: "white", 
                    transition: "all 0.2s" 
                }}
            >
            Salir
            </button>
        </div>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <div style={{ maxWidth: '1200px', margin: '25px auto', padding: "0 20px" }}>
        
        {/* CABECERA DEL DASHBOARD */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px", flexWrap: "wrap", gap: "20px" }}>
          
          <div>
            <h1 style={{ margin: "0 0 5px 0", color: "#333", fontSize: "2rem" }}>Mis exámenes</h1>
            <p style={{ margin: 0, color: "#888" }}>Tienes <strong>{myQuizzes.length} exámenes</strong> listos.</p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ position: "relative" }}>
              <input 
                type="text" 
                placeholder="Buscar examen..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "12px 20px", borderRadius: "30px", border: "1px solid #ddd", width: "250px",
                  fontSize: "0.95rem", outline: "none", boxShadow: "0 2px 5px rgba(0,0,0,0.02)"
                }}
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

        {/* GRID DE QUIZZES */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "25px" }}>
          
          {filteredQuizzes.length === 0 ? (
             <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: "60px", backgroundColor: "white", borderRadius: "20px", border: "2px dashed #eee" }}>
                <span style={{ fontSize: "3rem", display: "block", marginBottom: "10px" }}>📄</span>
                <p style={{ color: '#999', fontSize: "1.1rem" }}>
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
                  style={{
                    backgroundColor: "white",
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow: isHovered ? '0 15px 35px rgba(0,0,0,0.1)' : '0 4px 10px rgba(0,0,0,0.05)',
                    transform: isHovered ? 'translateY(-8px)' : 'none',
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                    position: "relative",
                    border: "1px solid #f0f0f0"
                  }}
                >
                  <div style={{ height: "6px", backgroundColor: myColor, width: "100%" }}></div>

                  <div style={{ padding: "25px" }}>
                    <div style={{ 
                      width: "40px", height: "40px", borderRadius: "10px", backgroundColor: `${myColor}20`, 
                      display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "15px",
                      color: myColor, fontSize: "1.2rem"
                    }}>
                      📝
                    </div>

                    <h3 style={{ margin: "0 0 10px 0", fontSize: '1.15rem', color: "#333", fontWeight: 700, lineHeight: 1.4 }}>
                      {quiz.title}
                    </h3>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: "20px" }}>
                      <span style={{ fontSize: '0.85rem', color: '#aaa', fontWeight: 500 }}>
                        {quiz.totalQuestions} Preguntas
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#ccc' }}>
                        {quiz.date}
                      </span>
                    </div>
                  </div>

                  {/* OVERLAY: Botón Play */}
                  <div style={{
                    position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                    background: "rgba(255,255,255,0.7)", backdropFilter: "blur(2px)",
                    display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "10px",
                    opacity: isHovered ? 1 : 0, transition: "opacity 0.2s ease"
                  }}>
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
                        setQuizToDelete(quiz.id); // Abre el modal bonito
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
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }} onClick={closeModal}>
          
          <div style={{
            backgroundColor: 'white', width: '90%', maxWidth: '500px',
            borderRadius: '20px', padding: '30px', position: 'relative',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)', animation: 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }} onClick={(e) => e.stopPropagation()}>
            
            <button onClick={closeModal} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#999' }}>✕</button>
            
            {!successData ? (
              // VISTA 1: SUBIR DOCUMENTO
              <>
                <h2 style={{ color: '#5A0E24', textAlign: 'center', marginBottom: '25px', fontWeight: '800' }}>
                  Subir Documento
                </h2>
                {!file ? (
                  <div className="upload-box">
                    <input type="file" id="pdf-upload" accept="application/pdf" onChange={handleFileChange} style={{ display: 'none' }} />
                    <label htmlFor="pdf-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: "column", alignItems: "center", gap: "10px" }}>
                       <span style={{ fontSize: "2.5rem" }}>📂</span>
                       <span style={{ color: '#5A0E24', fontWeight: '600', fontSize: "1.1rem" }}>Clic para subir PDF</span>
                    </label>
                  </div>
                ) : (
                  <div className="file-selected-box">
                    <span style={{ fontSize: "1.5rem" }}>📄</span>
                    <span style={{ fontWeight: "bold" }}>{file.name}</span>
                  </div>
                )}

                <button 
                  onClick={handleUpload}
                  disabled={!file || loading}
                  className="btn-generate"
                >
                  {loading ? (
                    <span style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
                      ⏳ Generando...
                    </span>
                  ) : "GENERAR PREGUNTAS"}
                </button>
              </>
            ) : (
              // VISTA 2: ÉXITO
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ fontSize: '5rem', marginBottom: '20px', animation: 'bounce 1s infinite' }}>🎉</div>
                <h2 style={{ color: '#2E7D32', marginBottom: '10px', fontSize: "2rem" }}>
                  ¡Examen Listo!
                </h2>
                <p style={{ color: '#666', marginBottom: '40px', fontSize: "1.1rem" }}>
                  Se generaron preguntas sobre "{successData.title}".
                </p>

                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                  <button onClick={closeModal} className="btn-modal-secondary">Cerrar</button>
                  <button 
                    onClick={() => navigate(`/edit/${successData.id}`, { state: { quizData: successData } })}
                    className="btn-modal-primary"
                  >
                    ✏️ Editar y Guardar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL DE CONFIRMACIÓN DE BORRADO --- */}
      {quizToDelete && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000
        }} onClick={() => setQuizToDelete(null)}>
          
          <div style={{
            backgroundColor: 'white', width: '90%', maxWidth: '400px',
            borderRadius: '24px', padding: '30px', textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)', animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }} onClick={(e) => e.stopPropagation()}>
            
            <h2 style={{ color: '#333', marginBottom: '10px', fontWeight: '800' }}>¿Eliminar examen?</h2>
            <p style={{ color: '#666', marginBottom: '25px', fontSize: '1rem' }}>
              Esta acción no se puede deshacer.
            </p>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              {/* BOTÓN CANCELAR (Clase nueva) */}
              <button 
                onClick={() => setQuizToDelete(null)} 
                className="btn-modal-secondary-pro"
              >
                Cancelar
              </button>

              {/* BOTÓN ELIMINAR (Clase nueva) */}
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

      {/* ESTILOS CSS */}
      <style>{`
        @keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        
        .btn-create-glow {
          background: linear-gradient(135deg, #4068a5 0%, #4068a5 100%);
          color: white; border: none; padding: 12px 25px; border-radius: 30px;
          font-size: 0.95rem; font-weight: bold; cursor: pointer;
          box-shadow: 0 4px 15px rgba(90, 14, 36, 0.3);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .btn-create-glow:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(26, 50, 111, 0.5); }

        .btn-play-hover {
          background: #5A0E24; color: white; border: none;
          padding: 12px 30px; border-radius: 30px;
          font-weight: bold; font-size: 1rem; cursor: pointer;
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
          transform: scale(0.9); transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .btn-play-hover:hover { transform: scale(1.05); background: #7A1E38; }

        .btn-delete-hover {
          background: #D32F2F; color: white; border: none;
          padding: 10px 20px; border-radius: 30px; width: 130px;
          font-weight: bold; font-size: 0.9rem; cursor: pointer;
          box-shadow: 0 5px 15px rgba(211, 47, 47, 0.3);
          transform: scale(0.9); transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .btn-delete-hover:hover { transform: scale(1.05); background: #B71C1C; }

        .upload-box {
          border: 3px dashed #D8E983; background-color: #FAFAFA;
          padding: 40px; border-radius: 20px; text-align: center;
          cursor: pointer; margin-bottom: 30px; transition: all 0.3s ease;
        }
        .upload-box:hover { background-color: #F6FBEF; border-color: #AEB877; transform: scale(1.02); }

        .file-selected-box {
          text-align: center; margin-bottom: 30px; padding: 20px;
          background: #E8F5E9; border-radius: 15px; color: #2E7D32;
          display: flex; align-items: center; justifyContent: center; gap: 10px; border: 2px solid #C8E6C9;
        }

        .btn-generate {
          width: 100%; padding: 16px; border-radius: 50px; border: none;
          font-weight: 800; font-size: 1.1rem; color: white; cursor: pointer;
          transition: all 0.3s ease;
          background: linear-gradient(135deg, #AEB877 0%, #8F9A5E 100%);
          box-shadow: 0 4px 15px rgba(174, 184, 119, 0.4);
        }
        .btn-generate:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(174, 184, 119, 0.6); filter: brightness(1.1); }
        .btn-generate:disabled { background: #E0E0E0; color: #999; box-shadow: none; cursor: not-allowed; transform: none; }

        .btn-modal-secondary {
          padding: 12px 30px; border-radius: 50px; border: 1px solid #E0E0E0;
          background-color: white; color: #666; font-weight: 600; font-size: 1rem;
          cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }
        .btn-modal-secondary:hover { background-color: #F5F5F5; color: #333; transform: translateY(-2px); box-shadow: 0 6px 15px rgba(0,0,0,0.1); }

        .btn-modal-primary {
          padding: 12px 35px; border-radius: 50px; border: none;
          background: linear-gradient(135deg, #5A0E24 0%, #7A1E38 100%);
          color: white; font-weight: bold; font-size: 1rem; cursor: pointer;
          transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(90, 14, 36, 0.3);
          display: flex; align-items: center; gap: 10px;
        }
        .btn-modal-primary:hover {
          background: linear-gradient(135deg, #70122D 0%, #942444 100%);
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(90, 14, 36, 0.4);
        }

        .btn-modal-secondary-pro {
          padding: 12px 30px; border-radius: 50px; border: 2px solid #E0E0E0;
          background-color: white; color: #666; font-weight: 700; font-size: 1rem;
          cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }
        .btn-modal-secondary-pro:hover {
          background-color: #F5F5F5; border-color: #ccc; color: #333;
          transform: translateY(-2px); box-shadow: 0 6px 15px rgba(0,0,0,0.1);
        }

        /* NUEVO: Botón de Peligro Profesional (Rojo Gradiente) */
        .btn-modal-danger-pro {
          padding: 12px 35px; border-radius: 50px; border: none;
          background: linear-gradient(135deg, #D32F2F 0%, #B71C1C 100%);
          color: white; font-weight: 800; font-size: 1rem; cursor: pointer;
          transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(211, 47, 47, 0.4);
        }
        .btn-modal-danger-pro:hover {
          background: linear-gradient(135deg, #E53935 0%, #C62828 100%);
          transform: translateY(-3px); box-shadow: 0 8px 25px rgba(211, 47, 47, 0.5);
        }

      `}</style>
    </div>
  );
}

// TUS CONSTANTES (Se quedan aquí abajo sin borrar)
const rowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#F9F9F9', borderRadius: '10px' };
const counterBtnStyle = { width: '30px', height: '30px', borderRadius: '50%', border: '1px solid #ccc', background: 'white', cursor: 'pointer', fontWeight: 'bold', color: '#5A0E24' };
const countStyle = { width: '20px', textAlign: 'center', fontWeight: 'bold' };