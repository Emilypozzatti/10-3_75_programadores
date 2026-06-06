const express = require("express");
const cors = require("cors");
const axios = require("axios");
require('dotenv').config({ path: './.env' });

const app = express();

app.use(cors());
app.use(express.json());

if (!process.env.GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY não encontrada no .env");
}

app.post("/diagnostico", async (req, res) => {
  try {
    const { planta, problema } = req.body;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content:
              "Você é um agrônomo especialista. Responda em português do Brasil. Gere possíveis tratamentos para a doença informada, incluindo cuidados imediatos, prevenção e um aviso para consultar um agrônomo em casos graves. Seja direto e use no máximo 12 linhas."
          },
          {
            role: "user",
            content: `Planta identificada: ${planta}\nPossíveis doenças/problemas encontrados na imagem: ${problema}\nDiga possíveis tratamentos e cuidados recomendados.`
          }
        ],
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const resultado = response.data.choices[0].message.content;

    res.json({ resultado });

  } catch (error) {
    console.error(error.response?.data || error.message);

    res.status(500).json({
      resultado: "Erro ao gerar diagnóstico"
    });
  }
});

app.listen(3001, () => {
  console.log("🔥 Backend rodando em http://127.0.0.1:3001");
});