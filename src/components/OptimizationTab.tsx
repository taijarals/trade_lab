import React, { useState } from 'react';
import { Candle, SimulationConfig, GridSearchRow } from '../types';
import { runGridSearch } from '../engine/optimizer';
import { Sliders, Award, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

interface OptimizationTabProps {
  candles: Candle[];
  config: SimulationConfig;
  setConfig: React.Dispatch<React.SetStateAction<SimulationConfig>>;
  darkMode: boolean;
}

export const OptimizationTab: React.FC<OptimizationTabProps> = ({
  candles,
  config,
  setConfig,
  darkMode,
}) => {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [gridResults, setGridResults] = useState<GridSearchRow[]>([]);

  const n = candles.length;
  const trainEnd = Math.floor(n * config.trainRatio);
  const trainCandles = candles.slice(0, trainEnd);
  const testCandles = candles.slice(trainEnd);

  const handleStartGridSearch = () => {
    if (candles.length === 0) return;
    setRunning(true);
    setProgress(0);

    setTimeout(() => {
      try {
        const results = runGridSearch(
          {
            strategyType: config.strategyType,
            baseConfig: config,
            trainCandles,
            testCandles,
          },
          (p) => setProgress(p)
        );
        setGridResults(results);
      } catch (err) {
        console.error('Grid search error:', err);
      } finally {
        setRunning(false);
      }
    }, 100);
  };

  const handleApplyParams = (params: any) => {
    setConfig({
      ...config,
      params: { ...config.params, ...params },
    });
    alert('Parâmetros aplicados com sucesso à simulação!');
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header Card */}
      <div className={`p-6 rounded-2xl shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sliders className="w-6 h-6 text-purple-500" />
              3. Otimização por Busca em Grade (Grid Search)
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Encontre os melhores parâmetros da estratégia testados exclusivamente no conjunto de Treino (proteção contra overfitting).
            </p>
          </div>
          <button
            onClick={handleStartGridSearch}
            disabled={running || candles.length === 0}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-xl shadow transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
            {running ? `Otimizando... ${progress}%` : 'Executar Grid Search'}
          </button>
        </div>

        {running && (
          <div className="mt-6">
            <div className="flex justify-between text-xs font-semibold text-gray-400 mb-1">
              <span>Progresso da Busca em Grade</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-700 h-2.5 rounded-full overflow-hidden">
              <div className="bg-purple-500 h-2.5 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Results Ranking Table */}
      {gridResults.length > 0 && (
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Ranking das Melhores Combinações de Parâmetros
          </h3>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-sm">
              <thead className={`sticky top-0 ${darkMode ? 'bg-gray-900 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3">Parâmetros</th>
                  <th className="p-3">Retorno Treino</th>
                  <th className="p-3">Retorno Teste</th>
                  <th className="p-3">Sharpe</th>
                  <th className="p-3">Taxa Acerto</th>
                  <th className="p-3">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {gridResults.slice(0, 15).map((row, idx) => {
                  const isOverfitting = row.testReturn < row.trainReturn * 0.5 && row.trainReturn > 5;
                  return (
                    <tr key={idx} className={darkMode ? 'hover:bg-gray-750' : 'hover:bg-gray-50'}>
                      <td className="p-3 font-bold text-gray-400">#{idx + 1}</td>
                      <td className="p-3 font-mono text-xs">
                        {JSON.stringify(row.params)}
                      </td>
                      <td className="p-3 font-bold text-emerald-500">+{row.trainReturn}%</td>
                      <td className={`p-3 font-bold ${row.testReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {row.testReturn > 0 ? '+' : ''}{row.testReturn}%
                      </td>
                      <td className="p-3">{row.sharpe}</td>
                      <td className="p-3">{row.winRate}%</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApplyParams(row.params)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow"
                          >
                            Aplicar
                          </button>
                          {isOverfitting && (
                            <span className="flex items-center gap-1 text-amber-500 text-xs" title="Retorno no teste é inferior à metade do treino (possível overfitting)">
                              <AlertTriangle className="w-4 h-4" /> Overfitting?
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
