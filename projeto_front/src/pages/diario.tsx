import { useState, useEffect, CSSProperties } from "react";

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
      data: new Date().toLocaleString("pt-BR"),
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
    <main style={styles.container}>
      {/* CARD INPUT */}
      <section style={styles.card}>
        <h2>📓 Diário Rural</h2>

        <div style={styles.inputBox}>
          <input
            type="text"
            placeholder="Ex: Adubei o milho hoje"
            value={textoManual}
            onChange={(e) => setTextoManual(e.target.value)}
            style={styles.input}
          />

          <button onClick={adicionarManual} style={styles.botaoPrincipal}>
            Adicionar
          </button>
        </div>
      </section>

      {/* LISTA */}
      <section style={styles.lista}>
        {listaSegura.length === 0 ? (
          <p style={{ textAlign: "center" }}>Nenhum registro ainda 📭</p>
        ) : (
          listaSegura.map((item, index) => (
            <div
              key={index}
              style={styles.itemCard}
              onClick={() =>
                setSelecionado(selecionado === item ? null : item)
              }
            >
              <p style={{ fontWeight: "bold" }}>
                {item.tipo === "Manual"
                  ? `🛠️ ${item.atividade}`
                  : `🌱 ${item.planta}`}
              </p>

              <span style={styles.data}>{item.data}</span>

              {/* 🔥 EXPANSÃO DENTRO DO CARD */}
              {selecionado === item && (
                <div style={styles.expansao}>
                  {item.tipo === "Manual" ? (
                    <p>{item.atividade}</p>
                  ) : (
                    <>
                      <p><b>Problema:</b> {item.problema}</p>

                      <div style={styles.respostaIA}>
                        {(item.solucao || "Sem solução")
                          .replace(/\*\*/g, "")
                          .replace(/\*/g, "")
                          .split("\n")
                          .map((linha, i) => {
                            if (!linha.trim()) return null;

                            if (linha.includes(":")) {
                              return (
                                <p key={i} style={{ fontWeight: "bold", marginTop: 10 }}>
                                  {linha}
                                </p>
                              );
                            }

                            return <p key={i}>{linha}</p>;
                          })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </section>
    </main>
  );
}
const styles: Record<string, CSSProperties> = {
  container: {
    minHeight: "100vh",
    padding: "30px 16px",
    background: "#f4f7f4",
    fontFamily: "Arial, sans-serif",
  },

  card: {
    maxWidth: "700px",
    margin: "0 auto",
    padding: "24px",
    borderRadius: "16px",
    background: "#ffffff",
    boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
    textAlign: "center",
  },

  inputBox: {
    display: "flex",
    gap: "10px",
    marginTop: "15px",
  },

  input: {
    flex: 1,
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },

  botaoPrincipal: {
    padding: "10px 14px",
    border: "none",
    borderRadius: "8px",
    background: "#2e7d32",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },

  lista: {
    marginTop: "20px",
    maxWidth: "700px",
    marginInline: "auto",
    display: "grid",
    gap: "10px",
  },

  itemCard: {
    background: "#fff",
    padding: "14px",
    borderRadius: "10px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
    cursor: "pointer",
  },

  data: {
    fontSize: "12px",
    color: "#777",
  },

  expansao: {
    marginTop: "12px",
    paddingTop: "10px",
    borderTop: "1px solid #eee",
  },

  respostaIA: {
    marginTop: "10px",
    background: "#f5f5f5",
    padding: "12px",
    borderRadius: "8px",
    lineHeight: "1.6",
  },
};