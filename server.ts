import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  app.use(express.json({ limit: '10mb' }));

  // API proxy for Foxbit candles to avoid CORS
  app.get('/api/foxbit/candles', async (req, res) => {
    try {
      const { market = 'xrpbrl', resolution = '1h', start_time, end_time } = req.query;
      let url = `https://api.foxbit.com.br/rest/v3/markets/${market}/candles?resolution=${resolution}`;
      if (start_time) url += `&start_time=${start_time}`;
      if (end_time) url += `&end_time=${end_time}`;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CryptoStrategyLab/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Foxbit API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('Foxbit proxy error:', error);
      res.status(500).json({ error: error.message || 'Falha ao buscar dados da Foxbit' });
    }
  });

  // API proxy for Foxbit ticker
  app.get('/api/foxbit/ticker', async (req, res) => {
    try {
      const { market = 'xrpbrl' } = req.query;
      const url = `https://api.foxbit.com.br/rest/v3/markets/${market}/ticker`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CryptoStrategyLab/1.0'
        }
      });
      if (!response.ok) {
        throw new Error(`Foxbit ticker error: ${response.status}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Falha ao buscar ticker da Foxbit' });
    }
  });

  // AI Analysis endpoint using Gemini SDK
  app.post('/api/ai-analyze', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: 'GEMINI_API_KEY não configurada no ambiente.' });
      }

      const { metrics, strategyName, params, tradesSample } = req.body;

      const ai = new GoogleGenAI({ apiKey });
      const modelName = 'gemini-2.5-flash';

      const prompt = `Você é um analista quantitativo sênior de criptomoedas. Analise os resultados da seguinte estratégia de trading de criptomoedas em ambiente de TREINAMENTO (anonimizado, sem datas reais e sem o nome do ativo).

Estratégia: ${strategyName}
Parâmetros atuais: ${JSON.stringify(params)}
Métricas de Treino: ${JSON.stringify(metrics)}
Amostra de Operações Recentes (anônimas): ${JSON.stringify(tradesSample || [])}

Responda em Português do Brasil de forma estruturada, em formato JSON válido com as seguintes chaves exatas:
{
  "diagnosis": "Diagnóstico detalhado do que funcionou e do que falhou na estratégia durante o treinamento.",
  "hypotheses": [
    {
      "title": "Nome da Hipótese 1",
      "justification": "Justificativa técnica detalhada.",
      "params": { "paramName": number },
      "riskEvaluation": "Avaliação do risco de overfitting (ajuste excessivo ao passado)."
    },
    {
      "title": "Nome da Hipótese 2",
      "justification": "Justificativa técnica detalhada.",
      "params": { "paramName": number },
      "riskEvaluation": "Avaliação do risco de overfitting."
    },
    {
      "title": "Nome da Hipótese 3",
      "justification": "Justificativa técnica detalhada.",
      "params": { "paramName": number },
      "riskEvaluation": "Avaliação do risco de overfitting."
    }
  ]
}
Retorne estritamente o JSON, sem markdown excessivo fora do bloco json.`;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error('Nenhuma resposta gerada pela IA.');
      }

      const parsed = JSON.parse(text);
      res.json(parsed);
    } catch (error: any) {
      console.error('AI Analysis error:', error);
      res.status(500).json({ error: error.message || 'Erro ao processar análise com IA.' });
    }
  });

  // Vite middleware for frontend development
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}

startServer();
