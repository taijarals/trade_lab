import { Candle, SimulationConfig, StrategyParams, StrategyType, GridSearchRow } from '../types';
import { runBacktestDataset } from './backtestEngine';

export interface OptimizerOptions {
  strategyType: StrategyType;
  baseConfig: SimulationConfig;
  trainCandles: Candle[];
  testCandles: Candle[];
}

export function runGridSearch(
  options: OptimizerOptions,
  onProgress?: (progress: number) => void
): GridSearchRow[] {
  const { strategyType, baseConfig, trainCandles, testCandles } = options;
  const paramCombinations: StrategyParams[] = [];

  if (strategyType === 'sma_crossover') {
    const shorts = [5, 9, 14, 20];
    const longs = [21, 30, 50, 100];
    for (const shortPeriod of shorts) {
      for (const longPeriod of longs) {
        if (shortPeriod < longPeriod) {
          paramCombinations.push({ shortPeriod, longPeriod });
        }
      }
    }
  } else if (strategyType === 'rsi') {
    const periods = [7, 14, 21];
    const oversolds = [20, 25, 30, 35];
    const overboughts = [65, 70, 75, 80];
    for (const rsiPeriod of periods) {
      for (const oversold of oversolds) {
        for (const overbought of overboughts) {
          if (oversold < overbought) {
            paramCombinations.push({ rsiPeriod, oversold, overbought });
          }
        }
      }
    }
  } else if (strategyType === 'bollinger') {
    const periods = [10, 20, 30];
    const stdDevs = [1.5, 2.0, 2.5];
    for (const bollingerPeriod of periods) {
      for (const bollingerStdDev of stdDevs) {
        paramCombinations.push({ bollingerPeriod, bollingerStdDev });
      }
    }
  } else if (strategyType === 'dca') {
    const amounts = [50, 100, 200];
    const intervals = [3, 5, 10, 15];
    for (const dcaAmount of amounts) {
      for (const dcaInterval of intervals) {
        paramCombinations.push({ dcaAmount, dcaInterval });
      }
    }
  }

  const results: GridSearchRow[] = [];
  const total = paramCombinations.length;

  for (let i = 0; i < total; i++) {
    const params = paramCombinations[i];
    const config: SimulationConfig = {
      ...baseConfig,
      strategyType,
      params,
    };

    const trainRes = runBacktestDataset(trainCandles, config, false);
    const testRes = runBacktestDataset(testCandles, config, false);

    results.push({
      params,
      trainReturn: trainRes.metrics.totalReturnPct,
      testReturn: testRes.metrics.totalReturnPct,
      sharpe: trainRes.metrics.sharpeRatio,
      winRate: trainRes.metrics.winRatePct,
      maxDrawdown: trainRes.metrics.maxDrawdownPct,
    });

    if (onProgress && i % Math.max(1, Math.floor(total / 10)) === 0) {
      onProgress(Math.round(((i + 1) / total) * 100));
    }
  }

  if (onProgress) onProgress(100);

  // Sort by train return descending
  results.sort((a, b) => b.trainReturn - a.trainReturn);
  return results;
}
