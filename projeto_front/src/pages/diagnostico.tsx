import { useState, type ChangeEvent, type CSSProperties } from "react";

type Taxonomia = {
  class?: string;
  family?: string;
  genus?: string;
  kingdom?: string;
  order?: string;
  phylum?: string;
};

type DiagnosticoProps = {
  salvar?: (planta: string, problema: string, solucao: string) => Promise<void> | void;
};

export default function Diagnostico({ salvar }: DiagnosticoProps) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [imagem, setImagem] = useState<string | null>(null);

  const [precisao, setPrecisao] = useState("");
  const [nomeCientifico, setNomeCientifico] = useState("");
  const [taxonomia, setTaxonomia] = useState<Taxonomia | null>(null);
  const [descricao, setDescricao] = useState("");

  const [statusSaude, setStatusSaude] = useState("");
  const [problemas, setProblemas] = useState<string[]>([]);
  const [tratamentoIA, setTratamentoIA] = useState("");

  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  function limparResultado() {
    setPrecisao("");
    setNomeCientifico("");
    setTaxonomia(null);
    setDescricao("");
    setStatusSaude("");
    setProblemas([]);
    setTratamentoIA("");
    setMensagem("");
    setErro("");
  }

  function selecionarImagem(event: ChangeEvent<HTMLInputElement>) {
    const arquivoSelecionado = event.target.files?.[0];
    if (!arquivoSelecionado) return;

    setArquivo(arquivoSelecionado);
    setImagem(URL.createObjectURL(arquivoSelecionado));
    limparResultado();
  }

  function converterParaBase64(arquivoSelecionado: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const leitor = new FileReader();

      leitor.onload = () => {
        const resultado = leitor.result as string;
        const base64 = resultado.split(",")[1];
        resolve(base64);
      };

      leitor.onerror = reject;
      leitor.readAsDataURL(arquivoSelecionado);
    });
  }

  function calcularPrecisao(probabilidade: number) {
    if (probabilidade >= 0.9) return "Alta";
    if (probabilidade >= 0.7) return "Média";
    return "Baixa";
  }

  async function traduzirDescricao(texto: string): Promise<string> {
    try {
      const textoLimitado = texto.substring(0, 450);

      const resposta = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textoLimitado)}&langpair=en|pt`
      );

      const dados = await resposta.json();
      return dados.responseData?.translatedText || texto;
    } catch {
      return texto;
    }
  }

  async function gerarTratamentoComIA(planta: string, problemasEncontrados: string[]) {
    const problema = problemasEncontrados.join(", ");

    if (!problema || problema === "Nenhum problema específico identificado.") {
      return "A planta não apresentou doença específica. Mantenha irrigação adequada e observe alterações.";
    }

    try {
      const resposta = await fetch("http://127.0.0.1:3001/diagnostico", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planta, problema }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) throw new Error();

      return typeof dados.resultado === "string"
        ? dados.resultado
        : JSON.stringify(dados.resultado);
    } catch {
      return "Erro ao conectar com a IA. Verifique o backend.";
    }
  }

  async function analisarImagem() {
    if (!arquivo) {
      alert("Selecione uma imagem!");
      return;
    }

    setCarregando(true);
    setErro("");
    setTratamentoIA("");

    try {
      const imagemBase64 = await converterParaBase64(arquivo);

      const resposta = await fetch(
        "https://api.plant.id/v3/identification?details=description,taxonomy",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Api-Key": import.meta.env.VITE_PLANT_ID_API_KEY,
          },
          body: JSON.stringify({
            images: [imagemBase64],
            health: "all",
          }),
        }
      );

      const dados = await resposta.json();
      const sugestao = dados.result?.classification?.suggestions?.[0];

    if (sugestao.details?.description?.value) {
      const traduzido = await traduzirDescricao(sugestao.details.description.value);

      const textoLimpo = traduzido
        .replace(/\(\;/g, "(") 
        .replace(/\s+/g, " "); 

      setDescricao(textoLimpo);
       }

      setNomeCientifico(sugestao.name);
      setPrecisao(calcularPrecisao(sugestao.probability));
      setTaxonomia(sugestao.details?.taxonomy || null);

      if (sugestao.details?.description?.value) {
        const traduzido = await traduzirDescricao(sugestao.details.description.value);
        setDescricao(traduzido);
      }

      const listaProblemas =
        dados.result?.disease?.suggestions?.slice(0, 3).map((d: any) => d.name) ||
        ["Nenhum problema específico identificado."];

      setProblemas(listaProblemas);

      const tratamento = await gerarTratamentoComIA(sugestao.name, listaProblemas);
      setTratamentoIA(tratamento);

    } catch {
      setErro("Erro ao analisar imagem.");
    } finally {
      setCarregando(false);
    }
  }

  async function salvarDiagnostico() {
    if (!nomeCientifico || !tratamentoIA) {
      setMensagem("Dados incompletos para salvar.");
      return;
    }

    const problema = problemas.join(", ");

    setSalvando(true);
    setMensagem("");

    try {
      const novo = {
        id: Date.now(),
        data: new Date().toLocaleString("pt-BR"),
        tipo: "Diagnóstico",
        planta: nomeCientifico,
        problema,
        solucao: tratamentoIA,
      };

      const resposta = await fetch("http://localhost:3000/diario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(novo),
      });

      if (!resposta.ok) throw new Error();

      setMensagem("Diagnóstico salvo com sucesso!");
    } catch {
      setMensagem("Erro ao salvar diagnóstico.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main style={styles.container}>
      <section style={styles.card}>
        <h2>🌱 Diagnóstico por imagem</h2>

        <label style={styles.uploadBox}>
          <input
            type="file"
            accept="image/*"
            onChange={selecionarImagem}
            style={styles.fileInput}
          />
          <strong>Selecionar imagem</strong>
          <span>Use uma foto nítida da planta.</span>
        </label>

        {imagem && <img src={imagem} style={styles.preview} />}

        <button onClick={analisarImagem} style={styles.botaoPrincipal}>
          {carregando ? "Analisando..." : "Analisar"}
        </button>

        {erro && <p style={styles.erro}>{erro}</p>}
      </section>

      {nomeCientifico && (
        <section style={styles.resultados}>
          <div style={styles.resultCard}>
            <h3>🌿 Planta</h3>
            <p><strong>Nome:</strong> {nomeCientifico}</p>
            <p><strong>Precisão:</strong> {precisao}</p>
            {descricao && (
            <p style={{ marginTop: "10px", lineHeight: "1.6" }}>
              {descricao}
            </p>
            )}
            </div>
          <div style={styles.resultCard}>
            <h3>🩺 Diagnóstico</h3>
            <ul>
              {problemas.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>

          {tratamentoIA && (
            <div style={styles.resultCardGrande}>
              <h3>💡 Tratamento</h3>
              <div style={styles.respostaIA}>
              {tratamentoIA
                .replace(/\*\*/g, "") // remove **
                .replace(/\*/g, "")   // remove *
                .split("\n")
                .map((linha, i) => {
                  if (linha.trim() === "") return null;

                  // títulos (tipo "Cuidados Imediatos:")
                  if (linha.includes(":")) {
                    return (
                      <p key={i} style={{ fontWeight: "bold", marginTop: "10px" }}>
                        {linha}
                      </p>
                    );
                  }

                  return (
                    <p key={i} style={{ marginBottom: "6px" }}>
                      {linha}
                    </p>
                  );
                })}
            </div>

              <button onClick={salvarDiagnostico} style={styles.botaoSecundario}>
                {salvando ? "Salvando..." : "💾 Salvar"}
              </button>

              {mensagem && <p style={styles.mensagem}>{mensagem}</p>}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

// 🔥 CORRETO
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
  uploadBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    padding: "20px",
    borderRadius: "12px",
    border: "2px dashed #4caf50",
    background: "#f1faf1",
    cursor: "pointer",
    marginTop: "12px",
  },
  fileInput: { display: "none" },
  preview: {
    marginTop: "15px",
    width: "100%",
    maxWidth: "300px",
    borderRadius: "12px",
  },
  botaoPrincipal: {
    marginTop: "15px",
    padding: "12px",
    width: "100%",
    border: "none",
    borderRadius: "10px",
    background: "#2e7d32",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },
  botaoSecundario: {
    marginTop: "10px",
    padding: "10px",
    border: "none",
    borderRadius: "8px",
    background: "#1565c0",
    color: "#fff",
    cursor: "pointer",
  },
  resultados: {
    display: "grid",
    gap: "15px",
    marginTop: "20px",
    maxWidth: "900px",
    marginInline: "auto",
  },
  resultCard: {
    background: "#fff",
    padding: "18px",
    borderRadius: "12px",
    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
  },
  resultCardGrande: {
    background: "#fff",
    padding: "18px",
    borderRadius: "12px",
    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
  },
  respostaIA: {
  padding: "16px",
  borderRadius: "10px",
  lineHeight: "1.6",
  fontSize: "14px",
  textAlign: "left",
  },
  erro: { color: "red", marginTop: "10px" },
  mensagem: {
    color: "green",
    marginTop: "10px",
    fontWeight: "bold",
  },
};