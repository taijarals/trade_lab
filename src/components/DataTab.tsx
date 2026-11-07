import React, { useState } from 'react';
import { Candle, Market, Timeframe, SimulationConfig } from '../types';
import { fetchFoxbitCandles, parseCSVToCandles } from '../services/foxbitService';
import { Database, Upload, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

interface DataTabProps {
  candles: Candle[];
  setCandles: (candles: Candle[]) => void;
  config: SimulationConfig;
  setConfig: React.Dispatch<React.SetStateAction<SimulationConfig>>;
  darkMode: boolean;
  onRunSimulation: () => void;
}

export const DataTab: React.FC<DataTabProps> = ({
  candles,
  setCandles,
  config,
  setConfig,
  darkMode,
  onRunSimulation,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [csvInput, setCsvInput] = useState('');
  const [showCsvModal, setShowCsvModal] = useState(false);

  const handleFetchFoxbit = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchFoxbitCandles(config.market, config.timeframe);
      setCandles(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao buscar dados da Foxbit.');
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSVToCandles(text);
        setCandles(parsed);
        setShowCsvModal(false);
        setErrorMsg(null);
      } catch (err: any) {
        setErrorMsg(err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleCsvPasteSubmit = () => {
    try {
      const parsed = parseCSVToCandles(csvInput);
      setCandles(parsed);
      setShowCsvModal(false);
      setErrorMsg(null);
      setCsvInput('');
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Split calculation
  const n = candles.length;
  const trainEnd = Math.floor(n * config.trainRatio);
  const testEnd = trainEnd + Math.floor(n * config.testRatio);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Top Banner */}
      <div className={`p-6 rounded-2xl shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Database className="w-6 h-6 text-blue-500" />
              1. Dados de Mercado & Divisão de Conjuntos
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Baixe dados históricos da Foxbit (v3 REST API) em Reais ou importe via CSV. Os dados são divididos em Treino (60%), Teste (20%) e Validação (20%).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleFetchFoxbit}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Baixando Foxbit...' : 'Baixar da Foxbit'}
            </button>
            <button
              onClick={() => setShowCsvModal(true)}
              className={`flex items-center gap-2 font-semibold px-4 py-2.5 rounded-xl border transition ${
                darkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-200' : 'border-gray-300 hover:bg-gray-100 text-gray-700'
              }`}
            >
              <Upload className="w-4 h-4" />
              Importar CSV
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Configuration inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Mercado Foxbit</label>
            <select
              value={config.market}
              onChange={(e) => setConfig({ ...config, market: e.target.value as Market })}
              className={`w-full p-2.5 rounded-xl border text-sm font-medium ${
                darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'
              }`}
            >
              <option value="xrpbrl">XRP/BRL (Ripple)</option>
              <option value="btcbrl">BTC/BRL (Bitcoin)</option>
              <option value="ethbrl">ETH/BRL (Ethereum)</option>
              <option value="ltcbrl">LTC/BRL (Litecoin)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Intervalo (Timeframe)</label>
            <select
              value={config.timeframe}
              onChange={(e) => setConfig({ ...config, timeframe: e.target.value as Timeframe })}
              className={`w-full p-2.5 rounded-xl border text-sm font-medium ${
                darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'
              }`}
            >
              <option value="15m">15 Minutos</option>
              <option value="1h">1 Hora</option>
              <option value="4h">4 Horas</option>
              <option value="1d">1 Dia</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Capital Inicial (R$)</label>
            <input
              type="number"
              value={config.initialCapital}
              onChange={(e) => setConfig({ ...config, initialCapital: Number(e.target.value) || 1000 })}
              className={`w-full p-2.5 rounded-xl border text-sm font-medium ${
                darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Taxa por Operação (%)</label>
            <input
              type="number"
              step="0.01"
              value={config.feePct}
              onChange={(e) => setConfig({ ...config, feePct: Number(e.target.value) || 0.5 })}
              className={`w-full p-2.5 rounded-xl border text-sm font-medium ${
                darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Dataset Overview & Split Status */}
      <div className={`p-6 rounded-2xl shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          Status do Conjunto de Dados ({candles.length} candles carregados)
        </h3>

        {candles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-900/50 border-blue-900/50' : 'bg-blue-50/50 border-blue-200'}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-blue-500">Conjunto de Treino (60%)</span>
                <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full font-semibold">{trainEnd} candles</span>
              </div>
              <p className="text-xs text-gray-400">Usado para otimização de parâmetros e diagnóstico de IA.</p>
              <p className="text-xs text-gray-500 mt-2">Início: {candles[0]?.dateStr} até {candles[trainEnd - 1]?.dateStr}</p>
            </div>

            <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-900/50 border-emerald-900/50' : 'bg-emerald-50/50 border-emerald-200'}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-emerald-500">Conjunto de Teste (20%)</span>
                <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-semibold">{testEnd - trainEnd} candles</span>
              </div>
              <p className="text-xs text-gray-400">Mostrado a cada simulação para validação fora da amostra.</p>
              <p className="text-xs text-gray-500 mt-2">Início: {candles[trainEnd]?.dateStr} até {candles[testEnd - 1]?.dateStr}</p>
            </div>

            <div className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-900/50 border-amber-900/50' : 'bg-amber-50/50 border-amber-200'}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-amber-500">Validação Final (20%)</span>
                <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full font-semibold">{n - testEnd} candles</span>
              </div>
              <p className="text-xs text-gray-400">Trancado. Executado apenas após confirmação explícita.</p>
              <p className="text-xs text-gray-500 mt-2">Início: {candles[testEnd]?.dateStr} até {candles[n - 1]?.dateStr}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            Nenhum dado carregado. Clique em "Baixar da Foxbit" ou "Importar CSV" para começar.
          </div>
        )}

        {candles.length > 0 && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={onRunSimulation}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition flex items-center gap-2"
            >
              Avançar para Simulação 🚀
            </button>
          </div>
        )}
      </div>

      {/* CSV Import Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className={`max-w-lg w-full p-6 rounded-2xl shadow-xl ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
            <h3 className="text-lg font-bold mb-3">Importar Candles via CSV</h3>
            <p className="text-xs text-gray-400 mb-4">
              Envie um arquivo CSV ou cole o conteúdo no formato: <br />
              <code>timestamp/data, open, high, low, close, volume</code>
            </p>

            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleCsvUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-4"
            />

            <div className="mb-4">
              <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Ou cole o texto CSV aqui:</label>
              <textarea
                rows={6}
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
                placeholder="2024-01-01 00:00:00, 3.50, 3.55, 3.48, 3.52, 12000"
                className={`w-full p-3 rounded-xl border text-xs font-mono ${
                  darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-800'
                }`}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCsvModal(false)}
                className="px-4 py-2 rounded-xl border text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleCsvPasteSubmit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow"
              >
                Processar CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
