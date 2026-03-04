import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/EditQuiz.css";

export default function EditQuiz() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const initialData = location.state?.quizData;
  const [currentId, setCurrentId] = useState(initialData?.id);

  const [quizTitle, setQuizTitle] = useState(initialData?.title || "Nuevo Quiz");
  const [questions, setQuestions] = useState(
  initialData?.questions || initialData?.questionsData || []);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!initialData) {
      navigate("/host");
    }
  }, [initialData, navigate]);

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

//Cambiar el tipo de pregunta
  const handleChangeType = (qIndex, newType) => {
    const updated = [...questions];
    const q = updated[qIndex];
    q.type = newType;

    if (newType === 'tf') {
      q.options = ["Verdadero", "Falso"];
      q.answer = "Verdadero";
    } else if (newType === 'single') {
      if (q.options.length === 2) {
         q.options = ["Opción 1", "Opción 2", "Opción 3", "Opción 4"];
      }
      q.answer = q.options[0];
    } else if (newType === 'multi') {
      if (q.options.length === 2) {
         q.options = ["Opción 1", "Opción 2", "Opción 3", "Opción 4"];
      }
      q.answer = [q.options[0], q.options[1]];
    }
    setQuestions(updated);
  };

  //Elegir la respuesta correcta
  const toggleCorrectAnswer = (qIndex, optText) => {
    const updated = [...questions];
    const q = updated[qIndex];

    if (q.type === 'multi') {
      let currentAnswers = Array.isArray(q.answer) ? [...q.answer] : [q.answer];
      
      if (currentAnswers.includes(optText)) {
        if(currentAnswers.length > 1) {
           currentAnswers = currentAnswers.filter(ans => ans !== optText);
        }
      } else {
        if (currentAnswers.length < 2) {
          currentAnswers.push(optText);
        } else {
          alert("En '2 Respuestas Correctas' solo puedes seleccionar máximo 2 opciones.");
          return;
        }
      }
      q.answer = currentAnswers;
    } else {
      q.answer = optText;
    }
    setQuestions(updated);
  };

  const handleConfigChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

//Añadir y borrar preguntas
  const handleAddQuestion = () => {
    const newQuestion = {
      type: "single",
      question: "",
      options: ["Opción 1", "Opción 2", "Opción 3", "Opción 4"],
      answer: "Opción 1",
      time: 20,
      points: 100
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleDeleteQuestion = (index) => {
    if (window.confirm("¿Seguro que quieres borrar esta pregunta?")) {
      const updated = questions.filter((_, i) => i !== index);
      setQuestions(updated);
    }
  };

  //Funciones de guardado
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
        method: method,
        headers: {
          "Content-Type": "application/json",
          "token": token
        },
        body: JSON.stringify({
          title: quizTitle,
          questions: questions,
          description: "Creado/Editado en CYRAQuiz"
        })
      });

      if (response.ok) {
        const savedData = await response.json();
        
        if (!isEditing) {
            console.log("Quiz creado. Actualizando ID temporal a:", savedData.id);
            setCurrentId(savedData.id); 
            
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

  const handleSaveOnly = async () => {
    console.log("Guardando cambios en BD...");
    const success = await saveToBackend();
    if (success) {
      triggerToast();
    }
  };

  //Empezar quiz
  const handleStartQuiz = async () => {
    await saveToBackend();

    console.log("Iniciando Quiz...", { title: quizTitle, questions });

    navigate(`/room/${initialData.id}`, { 
      state: { 
        quizData: { 
          ...initialData,         
          title: quizTitle,      
          questions: questions,   
          questionsData: questions 
        } 
      } 
    });
  };

  const triggerToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F8F9FA", paddingBottom: "100px", fontFamily: "'Poppins', sans-serif" }}>
      
      <div className={`toast-notification ${showToast ? 'show' : ''}`}>
        <span className="toast-icon">✔</span> 
        <span className="toast-text">Cambios guardados</span>
      </div>

      <nav className="edit-quiz-navbar">

        <div className="navbar-left">
          <button 
           onClick={() => navigate("/host")} 
           className="btn-glass-nav" 
           title="Volver al panel"
          >
            ← Volver
          </button>

          <div className="navbar-divider"></div>
          <h2 className="navbar-title">Editor de Quiz</h2>
        </div>
        
        <div className="navbar-right">
          
          <button onClick={handleSaveOnly} className="btn-nav-white">
            <span>💾</span> Guardar
          </button>

          <button onClick={handleStartQuiz} className="btn-nav-green">
            <span>▶</span> EMPEZAR QUIZ
          </button>
        </div>
      </nav>

      <div className="edit-quiz-content">
        <div className="quiz-title-wrapper">
          <input 
            type="text" 
            value={quizTitle} 
            onChange={(e) => setQuizTitle(e.target.value)}
            placeholder="Escribe el título aquí..."
            className="quiz-title-input"
          />
        </div>

        {questions.map((q, qIndex) => (
          <div key={qIndex} className="question-card">
            <div className="question-toolbar">
              <div className="toolbar-left">
                <div className="question-number-badge">
                  {qIndex + 1}
                </div>
                
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

              <div className="toolbar-right">
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
                
                <button 
                  onClick={() => handleDeleteQuestion(qIndex)} 
                  title="Eliminar pregunta" 
                  className="btn-delete-icon"
                >
                  <span className="delete-x-icon">✕</span>
                </button>
              </div>
            </div>

            <div className="question-edit-area">
              <div className="question-input-wrapper">
                 <textarea 
                  value={q.question} 
                  onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                  placeholder="Escribe tu pregunta aquí..." 
                  rows={2}
                  className="question-input-title"
                />
                <div className="underline-animation"></div>
              </div>

              <div className="edit-options-grid">
                {q.options && q.options.map((opt, optIndex) => {  
                  let isCorrect = false;
                  if (Array.isArray(q.answer)) { isCorrect = q.answer.includes(opt); } else { isCorrect = q.answer === opt; }
                  
                  return (
                    <div key={optIndex} className={`edit-option-card ${isCorrect ? "correct" : ""}`}>
                      <div 
                        onClick={() => toggleCorrectAnswer(qIndex, opt)} 
                        className="check-circle"
                        title="Marcar como correcta"
                      >
                        {isCorrect && <span style={{ lineHeight: 0, display: "block" }}>✔</span>}
                      </div>

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

        <div className="add-question-wrapper">
          <button onClick={handleAddQuestion} className="btn-add-floating">
            <span className="add-icon">+</span> Nueva Pregunta
          </button>
        </div>
      </div>
    </div>
  );
}

const CustomDropdown = ({ value, options, onChange, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

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
    <div ref={containerRef} className="custom-dropdown-container">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`dropdown-header ${isOpen ? 'open' : ''}`}
      >
        <div className="dropdown-header-left">
          {icon && <span className="dropdown-icon">{icon}</span>}
          <span className="dropdown-label">{selectedOption.label}</span>
        </div>
        <span className="dropdown-arrow">▼</span>
      </div>

      {isOpen && (
        <div className="dropdown-list">
          {options.map((opt) => (
            <div 
              key={opt.value}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className={`dropdown-option ${value === opt.value ? 'selected' : ''}`}
            >
              {value === opt.value && <span className="dropdown-check">✓</span>}
              <div className="dropdown-text-group">
                <span className="dropdown-option-label">
                  {opt.label}
                </span>
                {opt.desc && <span className="dropdown-option-desc">{opt.desc}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};