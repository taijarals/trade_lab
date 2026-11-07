import { Candle, StrategyParams, StrategyType } from '../types';
import { calculateSMA, calculateRSI, calculateBollingerBands } from '../utils/indicators';

export type Signal = 'BUY' | 'SELL' | 'HOLD';

export function generateSignals(
  candles: Candle[],
  strategyType: StrategyType,
  params: StrategyParams
): Signal[] {
  const signals: Signal[] = new Array(candles.length).fill('HOLD');

  if (candles.length === 0) return signals;

  switch (strategyType) {
    case 'sma_crossover': {
      const shortPeriod = params.shortPeriod || 9;
      const longPeriod = params.longPeriod || 21;
      const shortSMA = calculateSMA(candles, shortPeriod);
      const longSMA = calculateSMA(candles, longPeriod);

      for (let i = 1; i < candles.length; i++) {
        const prevShort = shortSMA[i - 1];
        const prevLong = longSMA[i - 1];
        const currShort = shortSMA[i];
        const currLong = longSMA[i];

        if (prevShort !== null && prevLong !== null && currShort !== null && currLong !== null) {
          if (prevShort <= prevLong && currShort > currLong) {
            signals[i] = 'BUY';
          } else if (prevShort >= prevLong && currShort < currLong) {
            signals[i] = 'SELL';
          }
        }
      }
      break;
    }

    case 'rsi': {
      const period = params.rsiPeriod || 14;
      const oversold = params.oversold || 30;
      const overbought = params.overbought || 70;
      const rsiValues = calculateRSI(candles, period);

      for (let i = 1; i < candles.length; i++) {
        const prevRsi = rsiValues[i - 1];
        const currRsi = rsiValues[i];

        if (prevRsi !== null && currRsi !== null) {
          if (prevRsi <= oversold && currRsi > oversold) {
            signals[i] = 'BUY';
          } else if (prevRsi >= overbought && currRsi < overbought) {
            signals[i] = 'SELL';
          }
        }
      }
      break;
    }

    case 'bollinger': {
      const period = params.bollingerPeriod || 20;
      const stdDev = params.bollingerStdDev || 2;
      const bb = calculateBollingerBands(candles, period, stdDev);

      for (let i = 1; i < candles.length; i++) {
        const prevClose = candles[i - 1].close;
        const prevLower = bb.lower[i - 1];
        const currClose = candles[i].close;
        const currLower = bb.lower[i];

        const prevUpper = bb.upper[i - 1];
        const currUpper = bb.upper[i - 1]; // or upper[i]

        if (prevLower !== null && currLower !== null && prevUpper !== null && currUpper !== null) {
          // Buy when price crosses back above lower band or touches lower band
          if (prevClose <= prevLower && currClose > prevLower) {
            signals[i] = 'BUY';
          } else if (prevClose >= prevUpper && currClose < prevUpper) {
            signals[i] = 'SELL';
          }
        }
      }
      break;
    }

    case 'dca': {
      const interval = params.dcaInterval || 5; // e.g. every 5 candles
      for (let i = 0; i < candles.length; i++) {
        if (i > 0 && i % interval === 0) {
          signals[i] = 'BUY';
        }
      }
      break;
    }

    default:
      break;
  }

  return signals;
}
