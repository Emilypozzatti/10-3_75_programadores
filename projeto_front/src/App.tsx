import { Routes, Route, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Diagnostico from "./pages/diagnostico";
import Diario from "./pages/diario";

type Registro = {
  data: string;
  planta: string;
  problema: string;
  solucao: string;
};

function App() {
  const [diario, setDiario] = useState<Registro[]>([]);

  // 🔥 CARREGAR DO BANCO (db.json)
  useEffect(() => {
    fetch("http://localhost:3002/diario")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDiario(data);
        } else {
          setDiario([]);
        }
      })
      .catch(() => setDiario([]));
  }, []);

  // 🔥 SALVAR NO BANCO
  async function salvar(planta: string, problema: string, solucao: string) {
    const novo: Registro = {
      data: new Date().toLocaleString(),
      planta,
      problema,
      solucao,
    };

    try {
      await fetch("http://localhost:3002/diario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(novo),
      });

      // atualiza tela sem recarregar
      setDiario((prev) => [...prev, novo]);
    } catch (err) {
      console.error("Erro ao salvar:", err);
    }
  }

  return (
    <div>
      <h1>🌱 AgroAssist</h1>

      <nav>
        <Link to="/">Diagnóstico</Link> |{" "}
        <Link to="/diario">Diário</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Diagnostico salvar={salvar} />} />
        <Route
          path="/diario"
          element={<Diario diario={diario} setDiario={setDiario} />}
        />
      </Routes>
    </div>
  );
}

export default App;