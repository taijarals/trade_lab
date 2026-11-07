import React, { useState } from 'react';
import { Candle, SimulationConfig, StrategyType, SimulationResult } from '../types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { PlayCircle, TrendingUp, ShieldCheck, Award, AlertCircle, Lock } from 'lucide-react';

interface SimulationTabProps {
  candles: Candle[];
  config: SimulationConfig;
  setConfig: React.Dispatch<React.SetStateAction<SimulationConfig>>;
  simulationResult: SimulationResult | null;
  onRunSimulation: () => void;
  onRunValidation: () => void;
  darkMode: boolean;
}

export const SimulationTab: React.FC<SimulationTabProps> = ({
  candles,
  config,
  setConfig,
  simulationResult,
  onRunSimulation,
  onRunValidation,
  darkMode,
}) => {
  const [activeDatasetTab, setActiveDatasetTab] = useState<'train' | 'test' | 'validation'>('train');

  const handleStrategyChange = (type: StrategyType) => {
    let newParams = { ...config.params };
    if (type === 'sma_crossover') {
      newParams = { shortPeriod: 9, longPeriod: 21, stopLossPct: 5, takeProfitPct: 10 };
    } else if (type === 'rsi') {
      newParams = { rsiPeriod: 14, oversold: 30, overbought: 70, stopLossPct: 5, takeProfitPct: 10 };
    } else if (type === 'bollinger') {
      newParams = { bollingerPeriod: 20, bollingerStdDev: 2, stopLossPct: 5, takeProfitPct: 10 };
    } else if (type === 'dca') {
      newParams = { dcaAmount: 100, dcaInterval: 5 };
    }
    setConfig({ ...config, strategyType: type, params: newParams });
  };

  const activeDatasetResult = simulationResult
    ? activeDatasetTab === 'train'
      ? simulationResult.train
      : activeDatasetTab === 'test'
      ? simulationResult.test
      : simulationResult.validation
    : null;

  const metrics = activeDatasetResult?.metrics;
  const benchmarkMetrics = activeDatasetResult?.benchmarkMetrics;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Strategy Selector & Parameters Card */}
      <div className={`p-6 rounded-2xl shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <PlayCircle className="w-6 h-6 text-emerald-500" />
              2. Motor de Simulação & Estratégias
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Configure a estratégia, parâmetros e gerenciamento de risco (Stop Loss / Take Profit).
            </p>
          </div>
          <button
            onClick={onRunSimulation}
            disabled={candles.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition flex items-center gap-2 disabled:opacity-50"
          >
            <TrendingUp className="w-5 h-5" />
            Executar Simulação
          </button>
        </div>

        {/* Strategy Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { id: 'sma_crossover', label: 'Cruzamento de Médias' },
            { id: 'rsi', label: 'RSI (Índice Força Relativa)' },
            { id: 'bollinger', label: 'Bandas de Bollinger' },
            { id: 'dca', label: 'DCA (Aporte Periódico)' },
          ].map((strat) => (
            <button
              key={strat.id}
              onClick={() => handleStrategyChange(strat.id as StrategyType)}
              className={`p-3.5 rounded-xl text-sm font-semibold border text-left transition ${
                config.strategyType === strat.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : darkMode
                  ? 'bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-750'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {strat.label}
            </button>
          ))}
        </div>

        {/* Dynamic Parameter Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {config.strategyType === 'sma_crossover' && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Período Curto (SMA)</label>
                <input
                  type="number"
                  value={config.params.shortPeriod || 9}
                  onChange={(e) => setConfig({ ...config, params: { ...config.params, shortPeriod: Number(e.target.value) } })}
                  className={`w-full p-2.5 rounded-xl border text-sm ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'}`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Período Longo (SMA)</label>
                <input
                  type="number"
                  value={config.params.longPeriod || 21}
                  onChange={(e) => setConfig({ ...config, params: { ...config.params, longPeriod: Number(e.target.value) } })}
                  className={`w-full p-2.5 rounded-xl border text-sm ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'}`}
                />
              </div>
            </>
          )}

          {config.strategyType === 'rsi' && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Período RSI</label>
                <input
                  type="number"
                  value={config.params.rsiPeriod || 14}
                  onChange={(e) => setConfig({ ...config, params: { ...config.params, rsiPeriod: Number(e.target.value) } })}
                  className={`w-full p-2.5 rounded-xl border text-sm ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'}`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Sobrevenda (Compra)</label>
                <input
                  type="number"
                  value={config.params.oversold || 30}
                  onChange={(e) => setConfig({ ...config, params: { ...config.params, oversold: Number(e.target.value) } })}
                  className={`w-full p-2.5 rounded-xl border text-sm ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'}`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Sobrecompra (Venda)</label>
                <input
                  type="number"
                  value={config.params.overbought || 70}
                  onChange={(e) => setConfig({ ...config, params: { ...config.params, overbought: Number(e.target.value) } })}
                  className={`w-full p-2.5 rounded-xl border text-sm ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'}`}
                />
              </div>
            </>
          )}

          {config.strategyType === 'bollinger' && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Período Bollinger</label>
                <input
                  type="number"
                  value={config.params.bollingerPeriod || 20}
                  onChange={(e) => setConfig({ ...config, params: { ...config.params, bollingerPeriod: Number(e.target.value) } })}
                  className={`w-full p-2.5 rounded-xl border text-sm ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'}`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Desvios Padrão</label>
                <input
                  type="number"
                  step="0.1"
                  value={config.params.bollingerStdDev || 2}
                  onChange={(e) => setConfig({ ...config, params: { ...config.params, bollingerStdDev: Number(e.target.value) } })}
                  className={`w-full p-2.5 rounded-xl border text-sm ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'}`}
                />
              </div>
            </>
          )}

          {config.strategyType === 'dca' && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Valor do Aporte (R$)</label>
                <input
                  type="number"
                  value={config.params.dcaAmount || 100}
                  onChange={(e) => setConfig({ ...config, params: { ...config.params, dcaAmount: Number(e.target.value) } })}
                  className={`w-full p-2.5 rounded-xl border text-sm ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'}`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Intervalo (N Candles)</label>
                <input
                  type="number"
                  value={config.params.dcaInterval || 5}
                  onChange={(e) => setConfig({ ...config, params: { ...config.params, dcaInterval: Number(e.target.value) } })}
                  className={`w-full p-2.5 rounded-xl border text-sm ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'}`}
                />
              </div>
            </>
          )}

          {config.strategyType !== 'dca' && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Stop Loss (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={config.params.stopLossPct || 5}
                  onChange={(e) => setConfig({ ...config, params: { ...config.params, stopLossPct: Number(e.target.value) } })}
                  className={`w-full p-2.5 rounded-xl border text-sm ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'}`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Take Profit (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={config.params.takeProfitPct || 10}
                  onChange={(e) => setConfig({ ...config, params: { ...config.params, takeProfitPct: Number(e.target.value) } })}
                  className={`w-full p-2.5 rounded-xl border text-sm ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'}`}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {simulationResult ? (
        <div className="space-y-6">
          {/* Dataset Switcher Tabs */}
          <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
            <button
              onClick={() => setActiveDatasetTab('train')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                activeDatasetTab === 'train' ? 'bg-blue-600 text-white shadow' : darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Treino (60%)
            </button>
            <button
              onClick={() => setActiveDatasetTab('test')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                activeDatasetTab === 'test' ? 'bg-emerald-600 text-white shadow' : darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Teste (20%)
            </button>
            <button
              onClick={() => {
                if (!simulationResult.validationUnlocked) {
                  onRunValidation();
                } else {
                  setActiveDatasetTab('validation');
                }
              }}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
                activeDatasetTab === 'validation' ? 'bg-amber-600 text-white shadow' : darkMode ? 'bg-gray-800 text-amber-400' : 'bg-gray-100 text-amber-700'
              }`}
            >
              {!simulationResult.validationUnlocked && <Lock className="w-3.5 h-3.5" />}
              Validação Final (20%) {simulationResult.validationUsageCount > 0 && `(Usos: ${simulationResult.validationUsageCount})`}
            </button>
          </div>

          {/* Metrics Summary Cards */}
          {metrics && benchmarkMetrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <p className="text-xs font-semibold uppercase text-gray-400">Retorno Total</p>
                <p className={`text-2xl font-black mt-1 ${metrics.totalReturnPct >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {metrics.totalReturnPct > 0 ? '+' : ''}{metrics.totalReturnPct}%
                </p>
                <p className="text-xs text-gray-400 mt-1">Capital Final: R$ {metrics.finalCapital.toLocaleString('pt-BR')}</p>
              </div>

              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <p className="text-xs font-semibold uppercase text-gray-400">vs. Comprar e Segurar</p>
                <p className={`text-2xl font-black mt-1 ${metrics.vsBenchmarkPct >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {metrics.vsBenchmarkPct > 0 ? '+' : ''}{metrics.vsBenchmarkPct}%
                </p>
                <p className="text-xs text-gray-400 mt-1">Benchmark: {benchmarkMetrics.totalReturnPct}%</p>
              </div>

              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <p className="text-xs font-semibold uppercase text-gray-400">Taxa de Acerto & Trades</p>
                <p className="text-2xl font-black mt-1 text-blue-500">{metrics.winRatePct}%</p>
                <p className="text-xs text-gray-400 mt-1">{metrics.totalTrades} operações executadas</p>
              </div>

              <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <p className="text-xs font-semibold uppercase text-gray-400">Drawdown Máx & Sharpe</p>
                <p className="text-2xl font-black mt-1 text-purple-500">{metrics.maxDrawdownPct}%</p>
                <p className="text-xs text-gray-400 mt-1">Índice Sharpe: {metrics.sharpeRatio}</p>
              </div>
            </div>
          )}

          {/* Equity Curve Chart */}
          {activeDatasetResult && (
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <h3 className="text-lg font-bold mb-4 flex items-center justify-between">
                <span>Curva de Patrimônio vs. Benchmark ({activeDatasetTab.toUpperCase()})</span>
                <span className="text-xs font-normal text-gray-400">Taxas e slippage deduzidos</span>
              </h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activeDatasetResult.equityCurve}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                    <XAxis dataKey="dateStr" stroke={darkMode ? '#9CA3AF' : '#4B5563'} fontSize={11} tickLine={false} />
                    <YAxis stroke={darkMode ? '#9CA3AF' : '#4B5563'} fontSize={11} tickLine={false} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                        borderColor: darkMode ? '#374151' : '#E5E7EB',
                        color: darkMode ? '#F3F4F6' : '#1F2937',
                        borderRadius: '12px',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="equity" name="Estratégia (R$)" stroke="#3B82F6" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="benchmarkEquity" name="Comprar & Segurar (R$)" stroke="#9CA3AF" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Trades Table */}
          {activeDatasetResult && activeDatasetResult.trades.length > 0 && (
            <div className={`p-6 rounded-2xl border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <h3 className="text-lg font-bold mb-4">Registro de Operações ({activeDatasetResult.trades.length})</h3>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-sm">
                  <thead className={`sticky top-0 ${darkMode ? 'bg-gray-900 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                    <tr>
                      <th className="p-3">Data / Hora</th>
                      <th className="p-3">Tipo</th>
                      <th className="p-3">Preço (R$)</th>
                      <th className="p-3">Qtd Cripto</th>
                      <th className="p-3">Taxa (R$)</th>
                      <th className="p-3">Total (R$)</th>
                      <th className="p-3">Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {activeDatasetResult.trades.map((t) => (
                      <tr key={t.id} className={darkMode ? 'hover:bg-gray-750' : 'hover:bg-gray-50'}>
                        <td className="p-3 text-gray-400">{t.dateStr}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-md text-xs font-bold ${t.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {t.type === 'BUY' ? 'COMPRA' : 'VENDA'}
                          </span>
                        </td>
                        <td className="p-3 font-mono">R$ {t.price.toLocaleString('pt-BR')}</td>
                        <td className="p-3 font-mono">{t.quantity}</td>
                        <td className="p-3 font-mono text-gray-400">R$ {t.fee}</td>
                        <td className="p-3 font-mono font-semibold">R$ {t.totalBrl.toLocaleString('pt-BR')}</td>
                        <td className="p-3 text-xs text-gray-400">{t.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={`p-12 text-center rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-white border-gray-200 text-gray-500'}`}>
          Nenhuma simulação executada ainda. Clique em "Executar Simulação" acima.
        </div>
      )}
    </div>
  );
};
