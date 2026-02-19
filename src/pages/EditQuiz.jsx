import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function EditQuiz() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const initialData = location.state?.quizData;
  const [currentId, setCurrentId] = useState(initialData?.id);

  const [quizTitle, setQuizTitle] = useState(initialData?.title || "Nuevo Quiz");
 const [questions, setQuestions] = useState(
  initialData?.questions || initialData?.questionsData || []
);
  // Estado para la notificación bonita (Toast)
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!initialData) {
      navigate("/host");
    }
  }, [initialData, navigate]);

  // --- LOGICA DE EDICIÓN (INTACTA) ---
  const handleQuestionTextChange = (index, newText) => {
    const updated = [...questions];
    updated[index].question = newText;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex, optIndex, newText) => {
    const updated = [...questions];
    const q = updated[qIndex];
    const oldText = q.options[optIndex];
    q.options[optIndex] = newText;

    if (q.type === 'multi') {
       if (Array.isArray(q.answer) && q.answer.includes(oldText)) {
           q.answer = q.answer.map(a => a === oldText ? newText : a);
       }
    } else {
       if (q.answer === oldText) {
           q.answer = newText;
       }
    }
    setQuestions(updated);
  };

// 1. Cambiar el tipo de pregunta
  const handleChangeType = (qIndex, newType) => {
    const updated = [...questions];
    const q = updated[qIndex];
    q.type = newType;

    if (newType === 'tf') {
      q.options = ["Verdadero", "Falso"];
      q.answer = "Verdadero"; // Por defecto
    } else if (newType === 'single') {
      // Si venía de V/F, le devolvemos 4 opciones vacías
      if (q.options.length === 2) {
         q.options = ["Opción 1", "Opción 2", "Opción 3", "Opción 4"];
      }
      q.answer = q.options[0]; // Seleccionamos la primera por defecto
    } else if (newType === 'multi') {
      if (q.options.length === 2) {
         q.options = ["Opción 1", "Opción 2", "Opción 3", "Opción 4"];
      }
      q.answer = [q.options[0], q.options[1]]; // Por defecto 2 correctas
    }
    setQuestions(updated);
  };

  // 2. Elegir la respuesta correcta (Blindado)
  const toggleCorrectAnswer = (qIndex, optText) => {
    const updated = [...questions];
    const q = updated[qIndex];

    if (q.type === 'multi') {
      // Lógica para 2 respuestas
      let currentAnswers = Array.isArray(q.answer) ? [...q.answer] : [q.answer];
      
      if (currentAnswers.includes(optText)) {
        if(currentAnswers.length > 1) { // Evitar desmarcar todas
           currentAnswers = currentAnswers.filter(ans => ans !== optText);
        }
      } else {
        if (currentAnswers.length < 2) { // Limitar a máximo 2
          currentAnswers.push(optText);
        } else {
          alert("En '2 Respuestas Correctas' solo puedes seleccionar máximo 2 opciones.");
          return;
        }
      }
      q.answer = currentAnswers;
    } else {
      // Lógica para 1 respuesta (Single y TF)
      q.answer = optText;
    }
    
    setQuestions(updated);
  };

  const handleConfigChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

// --- NUEVAS FUNCIONES: AÑADIR Y BORRAR PREGUNTAS ---
  const handleAddQuestion = () => {
    const newQuestion = {
      type: "single", // Por defecto creamos una de opción múltiple
      question: "",
      options: ["Opción 1", "Opción 2", "Opción 3", "Opción 4"],
      answer: "Opción 1",
      time: 20,
      points: 100
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleDeleteQuestion = (index) => {
    // Confirmación rápida para evitar borrar por accidente
    if (window.confirm("¿Seguro que quieres borrar esta pregunta?")) {
      const updated = questions.filter((_, i) => i !== index);
      setQuestions(updated);
    }
  };

  // --- FUNCIONES DE GUARDADO (CONECTADAS AL BACKEND) ---

  // Función auxiliar para enviar a la BD (Para no repetir código)
  const saveToBackend = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("⚠️ Debes iniciar sesión para guardar.");
      navigate("/login");
      return false;
    }

    try {
      const isHugeId = initialData?.id > 2147483647; 
      const isEditing = currentId && !isHugeId;
      
      const url = isEditing 
        ? `https://cyraquiz.onrender.com/quizzes/${currentId}` 
        : "https://cyraquiz.onrender.com/quizzes";
      
      const method = isEditing ? "PUT" : "POST";
      const response = await fetch(url, {
        method: method, // <--- Usamos la variable
        headers: {
          "Content-Type": "application/json",
          "token": token // Tu header de seguridad
        },
        body: JSON.stringify({
          title: quizTitle,
          questions: questions,
          description: "Creado/Editado en CYRAQuiz"
        })
      });

      if (response.ok) {
        const savedData = await response.json();
        
        // --- AQUÍ ESTÁ LA SOLUCIÓN MÁGICA ---
        // Si acabamos de crear (POST), actualizamos el ID en memoria al real.
        // Así, la próxima vez que guardes, el sistema sabrá que ya existe y hará PUT.
        if (!isEditing) {
            console.log("✅ Quiz creado. Actualizando ID temporal a:", savedData.id);
            setCurrentId(savedData.id); 
            
            // También actualizamos el initialData para que si navegas no se pierda
            if (initialData) initialData.id = savedData.id;
        }

        return true;
      } else {
        const err = await response.json();
        alert("Error al guardar: " + (err.message || "Intenta de nuevo"));
        return false;
    } 
  }
    catch (error) {
      console.error("Error:", error);
      alert("Error de conexión con el servidor");
      return false;
    }
  };

  // 1. SOLO GUARDAR (Se queda aquí)
  const handleSaveOnly = async () => {
    console.log("💾 Guardando cambios en BD...");
    const success = await saveToBackend(); // <--- LLAMADA REAL
    if (success) {
      triggerToast();
    }
  };

  // 3. EMPEZAR QUIZ
  const handleStartQuiz = async () => {
    // 1. PRIMERO: Guardamos los cambios (borrados/ediciones) en la base de datos
    // Así, si recargas la página del juego, no aparecerán los fantasmas.
    await saveToBackend();

    console.log("🚀 Iniciando Quiz con datos LIMPIOS...", { title: quizTitle, questions });

    // 2. LUEGO: Navegamos pasando explícitamente la lista 'questions' actual
    navigate(`/room/${initialData.id}`, { 
      state: { 
        quizData: { 
          ...initialData,         // Mantenemos ID, creador, etc.
          title: quizTitle,       // Título nuevo
          questions: questions,   // <--- ESTO ES LA CLAVE: Mandamos la lista filtrada actual
          questionsData: questions // <--- Doble seguridad por si tu GameRoom lo busca con este nombre
        } 
      } 
    });
  };

  // Helper para mostrar el toast
  const triggerToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F8F9FA", paddingBottom: "100px", fontFamily: "'Poppins', sans-serif" }}>
      
      {/* NOTIFICACIÓN TOAST */}
      <div style={{
        position: 'fixed', top: '90px', left: '50%', transform: showToast ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-20px)',
        opacity: showToast ? 1 : 0, backgroundColor: '#333', color: 'white', padding: '12px 25px', borderRadius: '50px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)', zIndex: 1000, transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        display: 'flex', alignItems: 'center', gap: '10px', pointerEvents: 'none'
      }}>
        <span style={{ color: '#00E676' }}>✔</span> <span style={{ fontWeight: '500' }}>Cambios guardados</span>
      </div>

      {/* NAVBAR */}
      <nav style={{ backgroundColor: "#5A0E24", color: "white", padding: "15px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
        
        {/* LADO IZQUIERDO: VOLVER */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button 
           onClick={() => navigate("/host")} 
           className="btn-glass-nav" // <--- CLASE NUEVA
           title="Volver al panel"
          >
            ← Volver
          </button>

          <div style={{ width: '1px', height: '25px', background: 'rgba(255,255,255,0.3)' }}></div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', letterSpacing: '0.5px' }}>Editor de Quiz</h2>
        </div>
        
        {/* LADO DERECHO: ACCIONES */}
        <div style={{ display: 'flex', gap: '15px' }}>
          
          {/* GUARDAR (Se queda aquí) */}
          <button onClick={handleSaveOnly} className="btn-nav-white">
            <span>💾</span> Guardar
          </button>

          {/* EMPEZAR */}
          <button onClick={handleStartQuiz} className="btn-nav-green">
            <span>▶</span> EMPEZAR QUIZ
          </button>

        </div>
      </nav>

      {/* CONTENIDO (Igual que antes) */}
      <div style={{ maxWidth: "900px", margin: "40px auto", padding: "0 20px" }}>
        <div style={{ background: "white", padding: "40px", borderRadius: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", marginBottom: "40px", textAlign: "center" }}>
        <input 
            type="text" 
            value={quizTitle} 
            onChange={(e) => setQuizTitle(e.target.value)}
            placeholder="Escribe el título aquí..."
            style={{ 
              width: "100%", fontSize: "2.5rem", fontWeight: "900", 
              border: "none", borderBottom: "3px solid #f0f0f0", 
              outline: "none", color: "#5A0E24", paddingBottom: "15px", 
              textAlign: "center", background: "transparent", 
              fontFamily: "'Poppins', sans-serif", transition: "border-color 0.3s"
            }}
            onFocus={(e) => e.target.style.borderColor = "#5A0E24"}
            onBlur={(e) => e.target.style.borderColor = "#f0f0f0"}
          />
        </div>

        {/* LISTA DE PREGUNTAS REDISEÑADA */}
        {questions.map((q, qIndex) => (
          <div key={qIndex} style={{ background: "white", borderRadius: "20px", marginBottom: "40px", boxShadow: "0 10px 40px rgba(0,0,0,0.08)", overflow: "visible", transition: "transform 0.2s", border: "1px solid #f0f0f0", position: "relative", zIndex: 10 }}>
            
            {/* 1. BARRA DE HERRAMIENTAS (Gris suave y limpia) */}
            <div style={{ background: "#FAFAFA", padding: "15px 30px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee" }}>
              
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                {/* Badge del Número */}
                <div style={{ 
      background: "#5A0E24", 
      color: "white", 
      width: "35px", // Tamaño fijo para círculo perfecto
      height: "35px", 
      borderRadius: "50%", // Hace que sea redondo
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      fontWeight: "bold", 
      fontSize: "0.85rem", 
      boxShadow: "0 2px 5px rgba(90, 14, 36, 0.2)" 
    }}>
      {qIndex + 1}
                </div>
                
                {/* Selector de Tipo */}
                <CustomDropdown 
                  value={q.type || 'single'}
                  onChange={(val) => handleChangeType(qIndex, val)}
                  options={[
                    { value: "single", label: "Selección Simple", desc: "1 Respuesta" },
                    { value: "multi", label: "Selección Múltiple", desc: "Varias Respuestas" },
                    { value: "tf", label: "Verdadero / Falso", desc: "Binaria" }
                  ]}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <CustomDropdown icon="⏱️" value={q.time || 20} onChange={(val) => handleConfigChange(qIndex, 'time', Number(val))}
                  options={[{ value: 10, label: "10 seg" },

                    { value: 20, label: "20 seg" },

                    { value: 30, label: "30 seg" },

                    { value: 60, label: "1 min" },

                    { value: 90, label: "1 min 30 seg" },

                    { value: 120, label: "2 min" },

                    { value: 150, label: "2 min 30 seg" },

                    { value: 180, label: "3 min" },

                    { value: 240, label: "4 min" },

                    { value: 300, label: "5 min" }]} 
                />
                <CustomDropdown icon="🏆" value={q.points || 100} onChange={(val) => handleConfigChange(qIndex, 'points', Number(val))}
                  options={[{ value: 50, label: "50 pts" },
    { value: 100, label: "100 pts" },
    { value: 200, label: "200 pts" },
    { value: 300, label: "300 pts" },
    { value: 400, label: "400 pts" },
    { value: 500, label: "500 pts" },]} 
                />
                
                {/* Botón Eliminar Minimalista */}
                <button 
                  onClick={() => handleDeleteQuestion(qIndex)} 
                  title="Eliminar pregunta" 
                  className="btn-delete-icon"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 0 }}
                >
                  <span style={{ marginTop: "-2px" }}>✕</span> {/* Ajuste fino visual si es necesario */}
    </button>
              </div>
            </div>

            {/* 2. ÁREA DE EDICIÓN (Contenido) */}
            <div style={{ padding: "40px" }}>
              
              {/* Input de Pregunta (Estilo Titular con línea animada) */}
              <div style={{ marginBottom: "30px" }}>
                 <textarea 
                  value={q.question} 
                  onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                  placeholder="Escribe tu pregunta aquí..." 
                  rows={2}
                  className="question-input-title"
                />
                <div className="underline-animation"></div>
              </div>

              {/* Grid de Opciones Visuales */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {q.options && q.options.map((opt, optIndex) => {
                  
                  let isCorrect = false;
                  if (Array.isArray(q.answer)) { isCorrect = q.answer.includes(opt); } else { isCorrect = q.answer === opt; }
                  
                  return (
                    <div key={optIndex} className={`option-card ${isCorrect ? "correct" : ""}`}>
                      
                      {/* Check Círculo */}
                      <div 
                        onClick={() => toggleCorrectAnswer(qIndex, opt)} 
                        className="check-circle"
                        title="Marcar como correcta"
                        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        {isCorrect && <span style={{ lineHeight: 0, display: "block" }}>✔</span>}
                      </div>

                      {/* Input Transparente */}
                      <input 
                        type="text" 
                        value={opt} 
                        readOnly={q.type === 'tf'} 
                        onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)} 
                        placeholder={`Opción ${optIndex + 1}`}
                        className="option-input-transparent"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        {/* --- NUEVO BOTÓN PARA AÑADIR PREGUNTA --- */}
        <div style={{ textAlign: "center", marginTop: "40px", paddingBottom: "80px" }}>
          <button onClick={handleAddQuestion} className="btn-add-floating">
            <span style={{ fontSize: "1.5rem", marginRight: "8px", lineHeight: 0, marginBottom: "4px" }}>+</span> Nueva Pregunta
          </button>
        </div>

<style>{`
        /* Botón Volver (Efecto Vidrio) */
        .btn-glass-nav {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.4);
          color: white;
          padding: 8px 20px;
          border-radius: 30px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.3s ease;
          display: flex; align-items: center; gap: 8px;
        }
        .btn-glass-nav:hover {
          background: rgba(255,255,255,0.25);
          transform: translateX(-3px);
        }

        /* Botón Guardar (Blanco limpio) */
        .btn-nav-white {
          background: white;
          border: none;
          color: #5A0E24;
          padding: 10px 25px;
          border-radius: 30px;
          cursor: pointer;
          font-weight: 700;
          font-size: 0.9rem;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
          display: flex; align-items: center; gap: 8px;
        }
        .btn-nav-white:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(0,0,0,0.2);
        }

        /* Botón Empezar (Verde Neón/Limon) */
        .btn-nav-green {
          background: linear-gradient(135deg, #D8E983 0%, #AEB877 100%);
          border: none;
          color: #3d3643;
          padding: 10px 30px;
          border-radius: 30px;
          cursor: pointer;
          font-weight: 800;
          font-size: 0.95rem;
          box-shadow: 0 4px 15px rgba(216, 233, 131, 0.4);
          transition: all 0.3s ease;
          display: flex; align-items: center; gap: 8px;
        }
        .btn-nav-green:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 8px 25px rgba(138, 153, 63, 0.6);
        }

        /* Botón Añadir Pregunta (Vino Flotante) */
        .btn-add-floating {
          background: linear-gradient(135deg, #5A0E24 0%, #7A1E38 100%);
          color: white;
          border: none;
          padding: 15px 40px;
          border-radius: 50px;
          cursor: pointer;
          font-weight: 700;
          font-size: 1rem;
          display: inline-flex; align-items: center; gap: 12px;
          box-shadow: 0 10px 25px rgba(90, 14, 36, 0.3);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .btn-add-floating:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 35px rgba(90, 14, 36, 0.4);
          background: linear-gradient(135deg, #70122D 0%, #942444 100%);
        }
          /* Input de Pregunta estilo Titular */
          .question-input-title {
            width: 100%; border: none; font-size: 1.4rem; font-family: 'Poppins', sans-serif; font-weight: 600;
            resize: none; outline: none; color: #333; background: transparent; padding: 10px 0;
          }
          .underline-animation {
            width: 100%; height: 2px; background: #eee; position: relative; transition: background 0.3s;
          }
          .question-input-title:focus + .underline-animation {
            background: linear-gradient(90deg, #5A0E24, #9F8383);
          }

          /* Tarjeta de Opción (Option Card) */
          .option-card {
            display: flex; alignItems: center; padding: 15px 20px;
            background: #FAFAFA; border-radius: 12px; border: 2px solid transparent;
            transition: all 0.2s ease; position: relative; cursor: text;
          }
          .option-card:hover { background: #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
          
          /* Estado Correcto */
          .option-card.correct {
            background: #E8F5E9; border-color: #66BB6A;
          }

          /* Input Transparente dentro de la tarjeta */
          .option-input-transparent {
            width: 100%; border: none; background: transparent; outline: none;
            font-size: 1rem; color: #555; font-weight: 500;
          }
          .correct .option-input-transparent { color: #1B5E20; font-weight: 700; }

          /* Círculo de Check */
          .check-circle {
            width: 26px; height: 26px; border-radius: 50%; border: 2px solid #ddd;
            margin-right: 15px; cursor: pointer; display: flex; align-items: center; justifyContent: center;
            color: white; font-size: 0.9rem; transition: all 0.2s; background: white; flex-shrink: 0;
          }
          .check-circle:hover { border-color: #aaa; transform: scale(1.1); }
          .correct .check-circle { background: #43A047; border-color: #43A047; }

          /* Botón Eliminar (X) */
          .btn-delete-icon {
            background: white; 
  border: 1px solid #eee; 
  color: #999;
  width: 35px; 
  height: 35px; 
  border-radius: 50%; /* También lo hice redondo para que combine con el número */
  cursor: pointer;
  font-size: 1rem; 
  display: flex; 
  align-items: center; 
  justify-content: center;
  padding: 0; /* Quita paddings internos que desalinean */
  transition: all 0.2s;
          }
          .btn-delete-icon:hover { background: #FFEBEE; color: #D32F2F; border-color: #FFCDD2; }

          /* Botón Añadir Flotante */
          .btn-add-floating {
            background: linear-gradient(135deg, #5A0E24 0%, #7A1E38 100%);
            color: white; border: none; padding: 16px 40px; border-radius: 50px;
            cursor: pointer; font-weight: 700; font-size: 1rem; display: inline-flex; align-items: center;
            box-shadow: 0 10px 30px rgba(90, 14, 36, 0.3); transition: transform 0.2s;
          }
          .btn-add-floating:hover { transform: translateY(-3px); box-shadow: 0 15px 40px rgba(90, 14, 36, 0.4); }
      `}</style>


      </div>
    </div>
  );
}

const pillStyle = { backgroundColor: "white", border: "1px solid #E0E0E0", borderRadius: "12px", padding: "8px 16px", display: "flex", alignItems: "center", gap: "10px", position: "relative", cursor: "pointer", minWidth: "140px", boxShadow: "0 2px 5px rgba(0,0,0,0.03)", transition: "transform 0.1s" };
const hiddenSelectStyle = { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" };

// --- COMPONENTE VISUAL: MENÚ DESPLEGABLE PERSONALIZADO ---
const CustomDropdown = ({ value, options, onChange, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Cerrar si clic afuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div ref={containerRef} style={{ position: "relative", minWidth: "220px" }}>
      {/* CABECERA (Lo que se ve siempre) */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "white", border: isOpen ? "2px solid #5A0E24" : "1px solid #E0E0E0",
          borderRadius: "12px", padding: "10px 15px", cursor: "pointer",
          transition: "all 0.2s", boxShadow: isOpen ? "0 4px 12px rgba(90, 14, 36, 0.1)" : "none"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {icon && <span style={{ fontSize: "1.2rem" }}>{icon}</span>}
          <span style={{ fontWeight: "600", color: "#333", fontSize: "0.9rem" }}>{selectedOption.label}</span>
        </div>
        <span style={{ fontSize: "0.8rem", color: "#999", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</span>
      </div>

      {/* LISTA DE OPCIONES (Se abre/cierra) */}
      {isOpen && (
        <div style={{
          position: "absolute", top: "115%", left: 0, width: "100%",
          background: "white", borderRadius: "12px", border: "1px solid #eee",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)", zIndex: 100,
          
          // --- ESTOS SON LOS CAMBIOS ---
          maxHeight: "250px",  // 1. Limita la altura máxima
          overflowY: "auto",   // 2. Activa el scroll vertical
          // overflow: "hidden", // <--- BORRA ESTA LÍNEA (o cámbiala)
          // ----------------------------

          animation: "fadeIn 0.2s ease-out"
        }}>
          {options.map((opt) => (
            <div 
              key={opt.value}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#F9F9F9"}
              onMouseLeave={(e) => e.currentTarget.style.background = "white"}
              style={{
                padding: "12px 15px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px",
                borderBottom: "1px solid #f9f9f9", transition: "background 0.1s"
              }}
            >
              {value === opt.value && <span style={{ color: "#2E7D32", fontWeight: "bold" }}>✓</span>}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: value === opt.value ? "700" : "500", color: value === opt.value ? "#5A0E24" : "#444", fontSize: "0.9rem" }}>
                  {opt.label}
                </span>
                {opt.desc && <span style={{ fontSize: "0.75rem", color: "#999" }}>{opt.desc}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};