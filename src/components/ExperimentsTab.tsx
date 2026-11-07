import React, { useState, useEffect } from 'react';
import { Experiment, SimulationConfig, Metrics, AIAnalysis } from '../types';
import { History, Save, Trash2, GitCompare, FileText } from 'lucide-react';

interface ExperimentsTabProps {
  currentConfig: SimulationConfig;
  currentTrainMetrics: Metrics | null;
  currentTestMetrics: Metrics | null;
  currentAiAnalysis?: AIAnalysis | null;
  darkMode: boolean;
}

export const ExperimentsTab: React.FC<ExperimentsTabProps> = ({
  currentConfig,
  currentTrainMetrics,
  currentTestMetrics,
  currentAiAnalysis,
  darkMode,
}) => {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [expName, setExpName] = useState('');
  const [expNotes, setExpNotes] = useState('');
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('crypto_lab_experiments');
    if (saved) {
      try {
        setExperiments(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load experiments', e);
      }
    }
  }, []);

  const saveToStorage = (updated: Experiment[]) => {
    setExperiments(updated);
    localStorage.setItem('crypto_lab_experiments', JSON.stringify(updated));
  };

  const handleSaveExperiment = () => {
    if (!expName.trim()) {
      alert('Por favor, informe um nome para o experimento.');
      return;
    }
    if (!currentTrainMetrics || !currentTestMetrics) {
      alert('Execute uma simulação primeiro antes de salvar o experimento.');
      return;
    }

    const newExp: Experiment = {
      id: `exp_${Date.now()}`,
      name: expName,
      timestamp: Date.now(),
      notes: expNotes,
      config: currentConfig,
      trainMetrics: currentTrainMetrics,
      testMetrics: currentTestMetrics,
      trainTradesCount: currentTrainMetrics.totalTrades,
      testTradesCount: currentTestMetrics.totalTrades,
      aiAnalysis: currentAiAnalysis || undefined,
      iterationsCount: 1,
    };

    saveToStorage([newExp, ...experiments]);
    setExpName('');
    setExpNotes('');
    alert('Experimento salvo com sucesso no histórico local!');
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja excluir este experimento?')) {
      saveToStorage(experiments.filter(e => e.id !== id));
      setSelectedForCompare(selectedForCompare.filter(i => i !== id));
    }
  };

  const toggleCompareSelect = (id: string) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(selectedForCompare.filter(i => i !== id));
    } else {
      if (selectedForCompare.length >= 3) {
        alert('Você pode comparar no máximo 3 experimentos lado a lado.');
        return;
      }
      setSelectedForCompare([...selectedForCompare, id]);
    }
  };

  const comparedExperiments = experiments.filter(e => selectedForCompare.includes(e.id));

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Save Current Experiment Card */}
      <div className={`p-6 rounded-2xl shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <History className="w-6 h-6 text-blue-500" />
          5. Histórico de Experimentos & Versões
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          Salve a configuração atual, métricas de treino/teste e suas anotações livres ("o que mudei e por quê").
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Nome do Experimento</label>
            <input
              type="text"
              value={expName}
              onChange={(e) => setExpName(e.target.value)}
              placeholder="Ex: SMA Otimizada v1 (RSI 14)"
              className={`w-full p-2.5 rounded-xl border text-sm ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'}`}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Anotações livres (O que mudei e por quê)</label>
            <input
              type="text"
              value={expNotes}
              onChange={(e) => setExpNotes(e.target.value)}
              placeholder="Ex: Aumentei o período longo para 30 para reduzir falsos sinais no XRP."
              className={`w-full p-2.5 rounded-xl border text-sm ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'}`}
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSaveExperiment}
            disabled={!currentTrainMetrics}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Salvar Experimento Atual
          </button>

          {selectedForCompare.length > 0 && (
            <button
              onClick={() => setShowCompareModal(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow transition"
            >
              <GitCompare className="w-4 h-4" />
              Comparar ({selectedForCompare.length}) Lado a Lado
            </button>
          )}
        </div>
      </div>

      {/* Experiments Timeline List */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <h3 className="text-lg font-bold mb-4">Linha do Tempo de Experimentos Salvos ({experiments.length})</h3>

        {experiments.length > 0 ? (
          <div className="space-y-4">
            {experiments.map((exp) => {
              const isSelected = selectedForCompare.includes(exp.id);
              return (
                <div
                  key={exp.id}
                  className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500/10'
                      : darkMode
                      ? 'border-gray-700 bg-gray-900/50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-base">{exp.name}</span>
                      <span className="text-xs text-gray-400">{new Date(exp.timestamp).toLocaleString('pt-BR')}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-semibold uppercase">
                        {exp.config.strategyType}
                      </span>
                    </div>
                    {exp.notes && (
                      <p className="text-xs text-gray-300 italic flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 shrink-0" /> {exp.notes}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-400 pt-1">
                      <span>Treino Retorno: <strong className={exp.trainMetrics.totalReturnPct >= 0 ? 'text-emerald-500' : 'text-red-500'}>+{exp.trainMetrics.totalReturnPct}%</strong></span>
                      <span>Teste Retorno: <strong className={exp.testMetrics.totalReturnPct >= 0 ? 'text-emerald-500' : 'text-red-500'}>{exp.testMetrics.totalReturnPct}%</strong></span>
                      <span>Sharpe: {exp.trainMetrics.sharpeRatio}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleCompareSelect(exp.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        isSelected ? 'bg-blue-600 text-white border-blue-600' : darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'
                      }`}
                    >
                      {isSelected ? 'Selecionado' : 'Comparar'}
                    </button>
                    <button
                      onClick={() => handleDelete(exp.id)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            Nenhum experimento salvo ainda.
          </div>
        )}
      </div>

      {/* Side-by-side Comparison Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className={`max-w-4xl w-full p-6 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-blue-500" />
              Comparação Lado a Lado ({comparedExperiments.length} experimentos)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {comparedExperiments.map((exp) => (
                <div key={exp.id} className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <h4 className="font-bold text-base mb-1">{exp.name}</h4>
                  <p className="text-xs text-gray-400 mb-3">{exp.notes || 'Sem anotações'}</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-gray-700">
                      <span className="text-gray-400">Estratégia:</span>
                      <span className="font-semibold">{exp.config.strategyType}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-700">
                      <span className="text-gray-400">Parâmetros:</span>
                      <span className="font-mono">{JSON.stringify(exp.config.params)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-700">
                      <span className="text-gray-400">Retorno Treino:</span>
                      <span className="font-bold text-emerald-500">+{exp.trainMetrics.totalReturnPct}%</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-700">
                      <span className="text-gray-400">Retorno Teste:</span>
                      <span className="font-bold text-emerald-500">{exp.testMetrics.totalReturnPct}%</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-700">
                      <span className="text-gray-400">Sharpe:</span>
                      <span className="font-semibold">{exp.trainMetrics.sharpeRatio}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-400">Max Drawdown:</span>
                      <span className="font-semibold text-red-400">{exp.trainMetrics.maxDrawdownPct}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowCompareModal(false)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow"
              >
                Fechar Comparação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
