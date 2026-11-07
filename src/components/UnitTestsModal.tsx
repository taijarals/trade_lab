import React, { useState, useEffect } from 'react';
import { runUnitTests, TestResultReport } from '../engine/unitTests';
import { CheckSquare, CheckCircle, XCircle, X } from 'lucide-react';

interface UnitTestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
}

export const UnitTestsModal: React.FC<UnitTestsModalProps> = ({ isOpen, onClose, darkMode }) => {
  const [reports, setReports] = useState<TestResultReport[]>([]);

  useEffect(() => {
    if (isOpen) {
      setReports(runUnitTests());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const allPassed = reports.every((r) => r.passed);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className={`max-w-lg w-full p-6 rounded-2xl shadow-xl ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-500" />
            Testes Unitários do Motor & Métricas
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-400 mb-6">
          Validação automatizada com amostra controlada de 15 candles para garantir a integridade do motor de simulação e cálculo de métricas.
        </p>

        <div className="space-y-3 mb-6">
          {reports.map((rep, idx) => (
            <div key={idx} className={`p-4 rounded-xl border flex items-start gap-3 ${rep.passed ? (darkMode ? 'bg-emerald-950/20 border-emerald-900/50' : 'bg-emerald-50 border-emerald-200') : (darkMode ? 'bg-red-950/20 border-red-900/50' : 'bg-red-50 border-red-200')}`}>
              {rep.passed ? (
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="font-bold text-sm">{rep.testName}</h4>
                <p className="text-xs text-gray-400 mt-1">{rep.message}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${allPassed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            {allPassed ? '✅ Todos os testes passaram com sucesso!' : '❌ Falha em alguns testes.'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
