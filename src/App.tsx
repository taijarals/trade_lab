import React, { useState, useEffect } from 'react';
import { Candle, SimulationConfig, SimulationResult } from './types';
import { generateRealisticFallbackCandles, fetchFoxbitCandles } from './services/foxbitService';
import { runFullSimulation } from './engine/backtestEngine';
import { Navbar, TabType } from './components/Navbar';
import { DataTab } from './components/DataTab';
import { SimulationTab } from './components/SimulationTab';
import { OptimizationTab } from './components/OptimizationTab';
import { AiAnalysisTab } from './components/AiAnalysisTab';
import { ExperimentsTab } from './components/ExperimentsTab';
import { PaperTradingTab } from './components/PaperTradingTab';
import { UnitTestsModal } from './components/UnitTestsModal';

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('data');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [config, setConfig] = useState<SimulationConfig>({
    market: 'xrpbrl',
    timeframe: '1h',
    strategyType: 'sma_crossover',
    params: { shortPeriod: 9, longPeriod: 21, stopLossPct: 5, takeProfitPct: 10 },
    initialCapital: 1000,
    feePct: 0.5,
    slippagePct: 0.1,
    trainRatio: 0.6,
    testRatio: 0.2,
    validationRatio: 0.2,
  });

  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [showTestsModal, setShowTestsModal] = useState(false);

  // Initial load fallback candles
  useEffect(() => {
    const initial = generateRealisticFallbackCandles('xrpbrl', 300);
    setCandles(initial);
    // Auto run initial simulation
    const res = runFullSimulation(initial, config);
    setSimulationResult(res);
  }, []);

  const handleRunSimulation = () => {
    if (candles.length === 0) return;
    const res = runFullSimulation(candles, config);
    setSimulationResult(res);
    setActiveTab('simulation');
  };

  const handleUnlockValidation = () => {
    if (!simulationResult) {
      alert('Execute uma simulação primeiro.');
      return;
    }
    if (confirm('Deseja desbloquear e executar o conjunto de Validação Final (20%)? Este conjunto é trancado para evitar vazamento de dados.')) {
      const newUsage = simulationResult.validationUsageCount + 1;
      if (newUsage > 1) {
        alert(`⚠️ Aviso: O conjunto de validação final já foi utilizado ${simulationUsageCount(newUsage)} vezes para esta mesma estratégia. O risco de sobreajuste é extremo.`);
      }
      setSimulationResult({
        ...simulationResult,
        validationUnlocked: true,
        validationUsageCount: newUsage,
      });
      setActiveTab('simulation');
    }
  };

  const simulationUsageCount = (count: number) => count;

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 ${darkMode ? 'bg-gray-950 text-gray-100 dark' : 'bg-gray-50 text-gray-900'}`}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenTests={() => setShowTestsModal(true)}
        validationUnlocked={simulationResult?.validationUnlocked || false}
        onUnlockValidation={handleUnlockValidation}
      />

      <main className="py-6">
        {activeTab === 'data' && (
          <DataTab
            candles={candles}
            setCandles={setCandles}
            config={config}
            setConfig={setConfig}
            darkMode={darkMode}
            onRunSimulation={handleRunSimulation}
          />
        )}

        {activeTab === 'simulation' && (
          <SimulationTab
            candles={candles}
            config={config}
            setConfig={setConfig}
            simulationResult={simulationResult}
            onRunSimulation={handleRunSimulation}
            onRunValidation={handleUnlockValidation}
            darkMode={darkMode}
          />
        )}

        {activeTab === 'optimization' && (
          <OptimizationTab
            candles={candles}
            config={config}
            setConfig={setConfig}
            darkMode={darkMode}
          />
        )}

        {activeTab === 'ai' && (
          <AiAnalysisTab
            simulationResult={simulationResult}
            config={config}
            setConfig={setConfig}
            darkMode={darkMode}
            onRunSimulation={handleRunSimulation}
          />
        )}

        {activeTab === 'experiments' && (
          <ExperimentsTab
            currentConfig={config}
            currentTrainMetrics={simulationResult?.train.metrics || null}
            currentTestMetrics={simulationResult?.test.metrics || null}
            darkMode={darkMode}
          />
        )}

        {activeTab === 'paper' && (
          <PaperTradingTab
            config={config}
            candles={candles}
            darkMode={darkMode}
          />
        )}
      </main>

      <UnitTestsModal
        isOpen={showTestsModal}
        onClose={() => setShowTestsModal(false)}
        darkMode={darkMode}
      />
    </div>
  );
}
