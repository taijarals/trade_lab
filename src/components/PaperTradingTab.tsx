import React, { useState, useEffect } from 'react';
import { SimulationConfig, Candle } from '../types';
import { PaperTradingManager, PaperSession } from '../services/paperTradingService';
import { Activity, Play, Square, AlertCircle } from 'lucide-react';

interface PaperTradingTabProps {
  config: SimulationConfig;
  candles: Candle[];
  darkMode: boolean;
}

export const PaperTradingTab: React.FC<PaperTradingTabProps> = ({
  config,
  candles,
  darkMode,
}) => {
  const [manager, setManager] = useState<PaperTradingManager | null>(null);
  const [session, setSession] = useState<PaperSession | null>(null);

  useEffect(() => {
    if (candles.length > 0) {
      const mgr = new PaperTradingManager(config, candles, (s) => setSession({ ...s }));
      setManager(mgr);
    }
  }, [config, candles]);

  const handleStart = () => {
    manager?.start();
  };

  const handleStop = () => {
    manager?.stop();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Top Banner */}
      <div className={`p-6 rounded-2xl shadow-sm border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Activity className="w-6 h-6 text-emerald-400" />
              6. Paper Trading (Dinheiro Fictício ao Vivo)
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Rode sua estratégia em tempo real com preços ao vivo da Foxbit e saldo fictício. Funciona enquanto o aplicativo estiver aberto.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {session?.isRunning ? (
              <button
                onClick={handleStop}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl shadow transition"
              >
                <Square className="w-5 h-5" />
                Parar Paper Trading
              </button>
            ) : (
              <button
                onClick={handleStart}
                disabled={!manager || candles.length === 0}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow transition disabled:opacity-50"
              >
                <Play className="w-5 h-5" />
                Iniciar Paper Trading
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Nota importante: O paper trading executa ordens simuladas em tempo real apenas com o app aberto no navegador. Nenhum fundo ou ordem real é enviado à Foxbit.</span>
        </div>
      </div>

      {/* Session Metrics */}
      {session && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <p className="text-xs font-semibold uppercase text-gray-400">Status</p>
            <p className={`text-xl font-black mt-1 ${session.isRunning ? 'text-emerald-500 animate-pulse' : 'text-gray-400'}`}>
              {session.isRunning ? '🔴 AO VIVO' : 'PAUSADO'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Última atualização: {session.lastUpdate}</p>
          </div>

          <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <p className="text-xs font-semibold uppercase text-gray-400">Preço Atual ({session.market.toUpperCase()})</p>
            <p className="text-xl font-black mt-1 text-blue-500">R$ {session.currentPrice.toLocaleString('pt-BR')}</p>
            <p className="text-xs text-gray-400 mt-1">Ticker Foxbit / Simulado</p>
          </div>

          <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <p className="text-xs font-semibold uppercase text-gray-400">Saldo em Reais</p>
            <p className="text-xl font-black mt-1 text-emerald-500">R$ {session.capitalBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-gray-400 mt-1">Disponível</p>
          </div>

          <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <p className="text-xs font-semibold uppercase text-gray-400">Posição Cripto</p>
            <p className="text-xl font-black mt-1 text-purple-500">{session.cryptoQty.toFixed(8)}</p>
            <p className="text-xs text-gray-400 mt-1">Preço Entrada: R$ {session.entryPrice.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Live Trades Log */}
      {session && session.trades.length > 0 && (
        <div className={`p-6 rounded-2xl border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h3 className="text-lg font-bold mb-4">Operações Executadas no Paper Trading ({session.trades.length})</h3>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-sm">
              <thead className={`sticky top-0 ${darkMode ? 'bg-gray-900 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                <tr>
                  <th className="p-3">Horário</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Preço (R$)</th>
                  <th className="p-3">Qtd Cripto</th>
                  <th className="p-3">Taxa (R$)</th>
                  <th className="p-3">Total (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {session.trades.map((t) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
