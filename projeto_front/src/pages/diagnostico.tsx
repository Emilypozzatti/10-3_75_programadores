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
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          textoLimitado
        )}&langpair=en|pt`
      );

      const dados = await resposta.json();
      return dados.responseData?.translatedText || texto;
    } catch (erroTraducao) {
      console.error("Erro ao traduzir:", erroTraducao);
      return texto;
    }
  }

  async function gerarTratamentoComIA(planta: string, problemasEncontrados: string[]) {
    const problema = problemasEncontrados.join(", ");

    if (!problema || problema === "Nenhum problema específico identificado.") {
      return "A planta não apresentou doença específica na análise. Como cuidado preventivo, mantenha irrigação adequada, boa ventilação, observe novas manchas ou amarelamentos e remova folhas muito danificadas quando necessário.";
    }

    try {
      const resposta = await fetch("http://127.0.0.1:3000/diagnostico", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planta, problema }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.resultado || "Erro ao consultar a IA");
      }

      return typeof dados.resultado === "string"
        ? dados.resultado
        : JSON.stringify(dados.resultado);
    } catch (erroIA) {
      console.error("Erro na IA:", erroIA);
      return "A doença foi identificada, mas não foi possível conectar com a IA de tratamentos. Verifique se o backend está rodando em http://127.0.0.1:3001 e se a chave GROQ_API_KEY está configurada.";
    }
  }

  async function analisarImagem() {
    if (!arquivo) {
      alert("Selecione uma imagem primeiro!");
      return;
    }

    setCarregando(true);
    setMensagem("");
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

      const textoResposta = await resposta.text();

      if (!resposta.ok) {
        throw new Error(textoResposta);
      }

      const dados = JSON.parse(textoResposta);
      const sugestaoPlanta = dados.result?.classification?.suggestions?.[0];

      let plantaIdentificada = "Planta não identificada";
      let statusIdentificado = "Não identificado";
      let listaProblemas = ["Nenhum problema específico identificado."];

      if (sugestaoPlanta) {
        const detalhes = sugestaoPlanta.details || {};

        plantaIdentificada = sugestaoPlanta.name;
        setPrecisao(calcularPrecisao(sugestaoPlanta.probability));
        setNomeCientifico(plantaIdentificada);
        setTaxonomia(detalhes.taxonomy || null);

        if (detalhes.description?.value) {
          setDescricao("Traduzindo descrição...");
          const descricaoTraduzida = await traduzirDescricao(detalhes.description.value);
          setDescricao(descricaoTraduzida);
        } else {
          setDescricao("Descrição não disponibilizada pela API.");
        }
      } else {
        setNomeCientifico(plantaIdentificada);
        setPrecisao("Não identificada");
        setDescricao("Não foi possível identificar a espécie com segurança.");
      }

      const estaSaudavel = dados.result?.is_healthy?.binary;

      if (estaSaudavel === true) {
        statusIdentificado = "Saudável";
      } else if (estaSaudavel === false) {
        statusIdentificado = "Atenção";
      }

      setStatusSaude(statusIdentificado);

      const sugestoesDoencas = dados.result?.disease?.suggestions || [];

      if (sugestoesDoencas.length > 0) {
        listaProblemas = sugestoesDoencas
          .slice(0, 3)
          .map((doenca: { name: string }) => doenca.name);
      }

      setProblemas(listaProblemas);

      const tratamento = await gerarTratamentoComIA(
        plantaIdentificada,
        listaProblemas
      );

      setTratamentoIA(tratamento);
    } catch (erroAnalise) {
      console.error(erroAnalise);
      setErro(
        "Não foi possível concluir a análise. Confira a chave VITE_PLANT_ID_API_KEY e tente novamente."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function salvarDiagnostico() {
    if (!nomeCientifico || !tratamentoIA) return;

    const problema = problemas.join(", ");

    setSalvando(true);
    setMensagem("");

    try {
      if (salvar) {
        await salvar(nomeCientifico, problema, tratamentoIA);
      } else {
        const novo = {
          data: new Date().toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          tipo: "Diagnóstico",
          planta: nomeCientifico,
          problema,
          solucao: tratamentoIA,
        };

        await fetch("http://localhost:3000/diario", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(novo),
        });
      }

      setMensagem("Diagnóstico salvo no diário com sucesso!");
    } catch (erroSalvar) {
      console.error("Erro ao salvar:", erroSalvar);
      setMensagem("Não foi possível salvar no diário.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main style={styles.container}>
      <section style={styles.card}>
        <h2>🌱 Diagnóstico por imagem</h2>
        <p style={styles.textoAuxiliar}>
          Envie uma foto da planta para identificar a espécie, verificar o estado
          de saúde e receber possíveis tratamentos com a IA do projeto.
        </p>

        <label style={styles.uploadBox}>
          <input
            type="file"
            accept="image/*"
            onChange={selecionarImagem}
            style={styles.fileInput}
          />
          <strong>Selecionar imagem</strong>
          <span>Use uma foto nítida das folhas, caule ou frutos afetados.</span>
        </label>

        {imagem && <img src={imagem} alt="Imagem enviada" style={styles.preview} />}

        <button onClick={analisarImagem} disabled={carregando} style={styles.botaoPrincipal}>
          {carregando ? "Analisando..." : "Analisar planta"}
        </button>

        {erro && <p style={styles.erro}>{erro}</p>}
      </section>

      {nomeCientifico && (
        <section style={styles.resultados}>
          <article style={styles.resultCard}>
            <h2>Relatório da planta</h2>

            <p>
              <strong>Precisão:</strong> {precisao}
            </p>

            <p>
              <strong>Nome científico:</strong> {nomeCientifico}
            </p>

            {taxonomia && (
              <>
                <h3>Taxonomia</h3>
                <ul>
                  {taxonomia.kingdom && <li>Reino: {taxonomia.kingdom}</li>}
                  {taxonomia.phylum && <li>Filo: {taxonomia.phylum}</li>}
                  {taxonomia.class && <li>Classe: {taxonomia.class}</li>}
                  {taxonomia.order && <li>Ordem: {taxonomia.order}</li>}
                  {taxonomia.family && <li>Família: {taxonomia.family}</li>}
                  {taxonomia.genus && <li>Gênero: {taxonomia.genus}</li>}
                </ul>
              </>
            )}

            <p>
              <strong>Descrição:</strong> {descricao}
            </p>
          </article>

          <article style={styles.resultCard}>
            <h2>Relatório de saúde</h2>

            <p>
              <strong>Status de saúde:</strong> {statusSaude}
            </p>

            <p>
              <strong>Possíveis problemas encontrados:</strong>
            </p>

            <ul>
              {problemas.map((problema, index) => (
                <li key={index}>{problema}</li>
              ))}
            </ul>
          </article>

          {tratamentoIA && (
            <article style={styles.resultCardGrande}>
              <h2>Possíveis tratamentos sugeridos pela IA</h2>
              <pre style={styles.respostaIA}>{tratamentoIA}</pre>

              <button
                onClick={salvarDiagnostico}
                disabled={salvando}
                style={styles.botaoSecundario}
              >
                {salvando ? "Salvando..." : "💾 Salvar no Diário"}
              </button>

              {mensagem && <p style={styles.mensagem}>{mensagem}</p>}
            </article>
          )}
        </section>
      )}
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    minHeight: "100vh",
    padding: "30px 16px",
  },
  card: {
    maxWidth: "850px",
    margin: "0 auto",
    padding: "26px",
    borderRadius: "18px",
    background: "#ffffff",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
  },
  textoAuxiliar: {
    color: "#526252",
    lineHeight: 1.5,
  },
  uploadBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    padding: "24px",
    borderRadius: "14px",
    border: "2px dashed #7fb77e",
    background: "#f7fff7",
    cursor: "pointer",
    textAlign: "center",
  },
  fileInput: {
    display: "none",
  },
  preview: {
    display: "block",
    width: "100%",
    maxWidth: "420px",
    maxHeight: "320px",
    objectFit: "cover",
    borderRadius: "14px",
    margin: "22px auto 0",
  },
  botaoPrincipal: {
    display: "block",
    width: "100%",
    marginTop: "20px",
    padding: "13px 18px",
    border: 0,
    borderRadius: "12px",
    background: "#2f7d32",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: 700,
    cursor: "pointer",
  },
  botaoSecundario: {
    marginTop: "14px",
    padding: "11px 16px",
    border: 0,
    borderRadius: "10px",
    background: "#22577a",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  },
  resultados: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "18px",
    maxWidth: "1100px",
    margin: "22px auto 0",
  },
  resultCard: {
    padding: "22px",
    borderRadius: "16px",
    background: "#ffffff",
    boxShadow: "0 10px 24px rgba(0, 0, 0, 0.08)",
    lineHeight: 1.6,
  },
  resultCardGrande: {
    gridColumn: "1 / -1",
    padding: "22px",
    borderRadius: "16px",
    background: "#ffffff",
    boxShadow: "0 10px 24px rgba(0, 0, 0, 0.08)",
    lineHeight: 1.6,
  },
  respostaIA: {
    whiteSpace: "pre-wrap",
    fontFamily: "inherit",
    background: "#f6f8f6",
    borderRadius: "12px",
    padding: "14px",
  },
  erro: {
    marginTop: "14px",
    padding: "12px",
    borderRadius: "10px",
    background: "#ffe8e8",
    color: "#a12b2b",
  },
  mensagem: {
    marginTop: "12px",
    color: "#2f7d32",
    fontWeight: 700,
  },
};
