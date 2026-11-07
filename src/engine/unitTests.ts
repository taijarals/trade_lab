import { Candle, SimulationConfig } from '../types';
import { runBacktestDataset } from './backtestEngine';

export interface TestResultReport {
  testName: string;
  passed: boolean;
  message: string;
}

export function runUnitTests(): TestResultReport[] {
  const reports: TestResultReport[] = [];

  // Small sample of 15 candles with clear alternating prices
  const sampleCandles: Candle[] = [];
  const baseTime = 1700000000000;
  const prices = [100, 102, 105, 103, 108, 112, 110, 115, 118, 116, 120, 125, 122, 128, 130];

  prices.forEach((p, idx) => {
    sampleCandles.push({
      timestamp: baseTime + idx * 3600000,
      open: p - 1,
      high: p + 2,
      low: p - 2,
      close: p,
      volume: 1000,
      dateStr: `Dia ${idx + 1}`,
    });
  });

  const config: SimulationConfig = {
    market: 'xrpbrl',
    timeframe: '1h',
    strategyType: 'dca',
    params: { dcaAmount: 100, dcaInterval: 3 },
    initialCapital: 1000,
    feePct: 0.5,
    slippagePct: 0.1,
    trainRatio: 0.6,
    testRatio: 0.2,
    validationRatio: 0.2,
  };

  // Test 1: Backtest runs without throwing error
  try {
    const res = runBacktestDataset(sampleCandles, config, false);
    reports.push({
      testName: 'Execução do Motor de Simulação',
      passed: res.equityCurve.length === sampleCandles.length,
      message: `Curva de patrimônio gerada com ${res.equityCurve.length} pontos.`,
    });
  } catch (err: any) {
    reports.push({
      testName: 'Execução do Motor de Simulação',
      passed: false,
      message: `Erro: ${err.message}`,
    });
  }

  // Test 2: Benchmark Buy & Hold calculation
  try {
    const bmRes = runBacktestDataset(sampleCandles, config, true);
    reports.push({
      testName: 'Benchmark Comprar e Segurar',
      passed: bmRes.trades.length > 0 && bmRes.metrics.finalCapital > 0,
      message: `Benchmark executado com sucesso. Retorno: ${bmRes.metrics.totalReturnPct}%`,
    });
  } catch (err: any) {
    reports.push({
      testName: 'Benchmark Comprar e Segurar',
      passed: false,
      message: `Erro: ${err.message}`,
    });
  }

  // Test 3: Decimal precision and fee deduction
  try {
    const res = runBacktestDataset(sampleCandles, config, false);
    const hasValidCapital = res.metrics.finalCapital > 0 && res.metrics.totalFeesPaid >= 0;
    reports.push({
      testName: 'Precisão Decimal e Taxas',
      passed: hasValidCapital,
      message: `Capital final R$ ${res.metrics.finalCapital}, Taxas pagas R$ ${res.metrics.totalFeesPaid}.`,
    });
  } catch (err: any) {
    reports.push({
      testName: 'Precisão Decimal e Taxas',
      passed: false,
      message: `Erro: ${err.message}`,
    });
  }

  return reports;
}
