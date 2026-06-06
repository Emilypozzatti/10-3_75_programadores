import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img src="/logo.png" style={styles.logo} />

        <h1 style={styles.titulo}>🌱 AgroTech</h1>
        <p style={styles.texto}>
          Diagnóstico inteligente de plantas + diário rural
        </p>

        {/* BOTÕES UM EMBAIXO DO OUTRO */}
        <button
          style={styles.botaoVerde}
          onClick={() => navigate("/diagnostico")}
        >
          🔍 Diagnóstico
        </button>

        <button
          style={styles.botaoAzul}
          onClick={() => navigate("/diario")}
        >
          📓 Diário
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "#f4f7f4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  // 🔥 CARD MAIOR
  card: {
    background: "#fff",
    padding: "60px 50px", // 🔥 AUMENTEI
    borderRadius: "20px",
    textAlign: "center",
    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
    width: "400px", // 🔥 LARGURA MAIOR
  },

  logo: {
    width: "140px", // 🔥 MAIOR
    marginBottom: "20px",
  },

  titulo: {
    fontSize: "32px",
    marginBottom: "10px",
  },

  texto: {
    fontSize: "16px",
    marginBottom: "25px",
    color: "#555",
  },

  // 🔥 BOTÕES EMPILHADOS
  botaoVerde: {
    display: "block",
    width: "100%",
    marginTop: "10px",
    padding: "14px",
    borderRadius: "12px",
    border: "none",
    background: "#2e7d32",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "16px",
    cursor: "pointer",
  },

  botaoAzul: {
    display: "block",
    width: "100%",
    marginTop: "15px",
    padding: "14px",
    borderRadius: "12px",
    border: "none",
    background: "#1565c0",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "16px",
    cursor: "pointer",
  },
};