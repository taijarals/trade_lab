import React from 'react';
import { Database, PlayCircle, Sliders, Brain, History, Activity, ShieldAlert, CheckSquare } from 'lucide-react';

export type TabType = 'data' | 'simulation' | 'optimization' | 'ai' | 'experiments' | 'paper';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  onOpenTests: () => void;
  validationUnlocked: boolean;
  onUnlockValidation: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  onOpenTests,
  validationUnlocked,
  onUnlockValidation,
}) => {
  return (
    <header className={`sticky top-0 z-50 shadow-md ${darkMode ? 'bg-gray-900 text-white border-b border-gray-800' : 'bg-white text-gray-800 border-b border-gray-200'}`}>
      {/* Fixed risk warning banner */}
      <div className="bg-amber-500 text-black px-4 py-1.5 text-xs font-bold text-center flex items-center justify-center gap-2">
        <ShieldAlert className="w-4 h-4 shrink-0" />
        <span>AVISO LEGAL: Simulação — resultados passados não garantem resultados futuros. Este aplicativo é estritamente para fins educacionais e de pesquisa.</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-xl font-black text-xl tracking-wider shadow-inner">
            LC
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight">Laboratório de Estratégias Cripto</h1>
            <p className="text-xs text-gray-400">Backtest profissional em Reais com Foxbit e IA Gemini</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto py-1">
          <button
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'data' ? 'bg-blue-600 text-white shadow' : darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <Database className="w-4 h-4" />
            Dados
          </button>
          <button
            onClick={() => setActiveTab('simulation')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'simulation' ? 'bg-blue-600 text-white shadow' : darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <PlayCircle className="w-4 h-4" />
            Simulação
          </button>
          <button
            onClick={() => setActiveTab('optimization')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'optimization' ? 'bg-blue-600 text-white shadow' : darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Otimização
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'ai' ? 'bg-blue-600 text-white shadow' : darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <Brain className="w-4 h-4 text-purple-400" />
            Análise IA
          </button>
          <button
            onClick={() => setActiveTab('experiments')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'experiments' ? 'bg-blue-600 text-white shadow' : darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <History className="w-4 h-4" />
            Experimentos
          </button>
          <button
            onClick={() => setActiveTab('paper')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'paper' ? 'bg-blue-600 text-white shadow' : darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            Paper Trading
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {!validationUnlocked && (
            <button
              onClick={onUnlockValidation}
              className="px-3 py-1.5 text-xs font-bold bg-amber-600/20 text-amber-500 border border-amber-500/30 rounded-lg hover:bg-amber-600/30 transition"
              title="Desbloquear Validação Final (Trancada)"
            >
              🔒 Validação Final
            </button>
          )}
          <button
            onClick={onOpenTests}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Testes Unitários
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm"
            title="Alternar Tema"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  );
};
