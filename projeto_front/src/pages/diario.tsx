import { useState, useEffect } from "react";

type Registro = {
  data: string;
  planta: string;
  tipo?: string;
  problema?: string;
  solucao?: string;
  atividade?: string;
};

export default function Diario({ diario, setDiario }: any) {
  const [selecionado, setSelecionado] = useState<Registro | null>(null);
  const [textoManual, setTextoManual] = useState("");

  useEffect(() => {
    fetch("http://localhost:3000/diario")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setDiario(data);
        else setDiario([]);
      })
      .catch(() => setDiario([]));
  }, []);

  const listaSegura: Registro[] = Array.isArray(diario) ? diario : [];

  async function adicionarManual() {
  if (!textoManual.trim()) return;

  const novo = {
    data: new Date().toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    tipo: "Manual",
    atividade: textoManual,
  };

  try {
    const response = await fetch("http://localhost:3000/diario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novo),
    });

    const salvo = await response.json();

    setDiario((prev: any) => [...prev, salvo]);
    setTextoManual("");
  } catch (err) {
    console.error("Erro ao salvar:", err);
  }
}

  return (
    <div>
      <h2>📓 Diário Rural</h2>

      {/* INPUT */}
      <div style={{ marginBottom: 10 }}>
        <input
          type="text"
          placeholder="Ex: Adubei o milho hoje"
          value={textoManual}
          onChange={(e) => setTextoManual(e.target.value)}
        />

        <button onClick={adicionarManual}>
          Adicionar atividade
        </button>
      </div>

      {/* LISTA */}
      {listaSegura.length === 0 ? (
        <p>Nenhum registro ainda 📭</p>
      ) : (
        <ul>
          {listaSegura.map((item, index) => (
            <li
              key={index}
              style={{ cursor: "pointer" }}
              onClick={() => setSelecionado(item)}
            >
              {item.tipo === "Manual"
                ? `🛠️ ${item.atividade}`
                : `🌱 ${item.planta} → ${item.problema}`}
            </li>
          ))}
        </ul>
      )}

      {/* DETALHE */}
      {selecionado && (
        <div>
          {selecionado.tipo === "Manual" ? (
            <>
              <h3>🛠️ Atividade da Fazenda</h3>
              <p><b>Data:</b> {selecionado.data}</p>
              <p>{selecionado.atividade}</p>
            </>
          ) : (
            <>
              <h3>🌱 Diagnóstico</h3>
              <p><b>Data:</b> {selecionado.data}</p>
              <p><b>Planta:</b> {selecionado.planta}</p>
              <p><b>Problema:</b> {selecionado.problema}</p>
              <p><b>Solução:</b> {selecionado.solucao ?? "Sem solução"}</p>
            </>
          )}

          <button onClick={() => setSelecionado(null)}>
            Fechar
          </button>
        </div>
      )}
    </div>
  );
}