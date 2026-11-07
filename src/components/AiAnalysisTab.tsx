import React, { useState } from 'react';
import { SimulationResult, SimulationConfig, AIAnalysis, StrategyParams } from '../types';
import { Brain, Sparkles, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

interface AiAnalysisTabProps {
  simulationResult: SimulationResult | null;
  config: SimulationConfig;
  setConfig: React.Dispatch<React.SetStateAction<SimulationConfig>>;
  darkMode: boolean;
  onRunSimulation: () => void;
}

export const AiAnalysisTab: React.FC<AiAnalysisTabProps> = ({
  simulationResult,
  config,
  setConfig,
  darkMode,
  onRunSimulation,
}) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [iterationsCount, setIterationsCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAnalyzeWithAI = async () => {
    if (!simulationResult) return;
    setLoading(true);
    setErrorMsg(null);

    const newCount = iterationsCount + 1;
    setIterationsCount(newCount);

    try {
      const trainRes = simulationResult.train;
      // Anonymize trades: strip real dates/timestamps, use sequenced indices
      const tradesSample = trainRes.trades.slice(-15).map((t, idx) => ({
        op: idx + 1,
        type: t.type,
        price: t.price,
        qty: t.quantity,
        fee: t.fee,
        reason: t.reason,
      }));

      const payload = {
        metrics: trainRes.metrics,
        strategyName: config.strategyType,
        params: config.params,
        tradesSample,
      };

      const res = await fetch('/api/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao comunicar com o servidor de IA.');
      }

      const data = await res.json();
      setAnalysis(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyHypothesisParams = (params: StrategyParams) => {
    setConfig({
      ...config,
      params: { ...config.params, ...params },
    });
    onRunSimulation();
    alert('Parâmetros da IA aplicados e simulação recalculada!');
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header Card */}
      <div className={`p-6 rounded-2xl shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Brain className="w-6 h-6 text-purple-400" />
              4. Análise por Inteligência Artificial (Gemini)
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Envia apenas dados anônimos de treinamento (métricas, parâmetros e operações) para o Gemini gerar hipóteses de melhoria.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-xl border text-xs font-bold ${iterationsCount > 20 ? 'bg-red-500/10 border-red-500 text-red-500' : darkMode ? 'bg-gray-900 border-gray-700 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-700'}`}>
              Iterações de Treino: {iterationsCount} / 20
            </div>
            <button
              onClick={handleAnalyzeWithAI}
              disabled={loading || !simulationResult}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition disabled:opacity-50"
            >
              <Sparkles className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Analisando...' : 'Analisar com IA'}
            </button>
          </div>
        </div>

        {iterationsCount > 20 && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Atenção: Você ultrapassou 20 iterações no mesmo período de treino. O risco de overfitting (ajuste excessivo) é elevado.</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm">
            {errorMsg}
          </div>
        )}
      </div>

      {/* AI Response Display */}
      {analysis ? (
        <div className="space-y-6">
          {/* Diagnosis */}
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className="text-lg font-bold mb-3 text-purple-400 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Diagnóstico do Analista Quantitativo
            </h3>
            <p className="text-sm leading-relaxed text-gray-300">{analysis.diagnosis}</p>
          </div>

          {/* Hypotheses */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {analysis.hypotheses?.map((hyp, idx) => (
              <div key={idx} className={`p-6 rounded-2xl border flex flex-col justify-between ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Hipótese #{idx + 1}</span>
                    <span className="text-xs font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">
                      {JSON.stringify(hyp.params)}
                    </span>
                  </div>
                  <h4 className="font-bold text-base mb-2">{hyp.title}</h4>
                  <p className="text-xs text-gray-400 mb-4 leading-relaxed">{hyp.justification}</p>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400 mb-4">
                    <strong>Risco de Overfitting:</strong> {hyp.riskEvaluation}
                  </div>
                </div>

                <button
                  onClick={() => handleApplyHypothesisParams(hyp.params)}
                  className="w-full mt-4 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-xl text-xs shadow transition"
                >
                  <span>Aplicar Parâmetros e Simular</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={`p-12 text-center rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-white border-gray-200 text-gray-500'}`}>
          Clique em "Analisar com IA" para gerar um diagnóstico profissional e sugestões de melhoria baseadas no treino.
        </div>
      )}
    </div>
  );
};
