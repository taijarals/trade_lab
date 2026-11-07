import { Candle } from '../types';

export function calculateSMA(candles: Candle[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += candles[j].close;
      }
      result.push(sum / period);
    }
  }
  return result;
}

export function calculateRSI(candles: Candle[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = [];
  if (candles.length === 0) return result;

  let gains = 0;
  let losses = 0;

  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      result.push(null);
      continue;
    }

    const change = candles[i].close - candles[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    if (i <= period) {
      gains += gain;
      losses += loss;
      if (i === period) {
        const avgGain = gains / period;
        const avgLoss = losses / period;
        if (avgLoss === 0) {
          result.push(100);
        } else {
          const rs = avgGain / avgLoss;
          result.push(100 - (100 / (1 + rs)));
        }
      } else {
        result.push(null);
      }
    } else {
      // Wilder's smoothing
      const prevRSI = result[i - 1];
      // Reconstruct prev avgGain & avgLoss if needed, or approximate smoothly:
      // A standard approx for rolling smoothing:
      let sumGain = 0;
      let sumLoss = 0;
      for (let j = i - period + 1; j <= i; j++) {
        const ch = candles[j].close - candles[j - 1].close;
        if (ch > 0) sumGain += ch;
        else sumLoss -= ch;
      }
      const avgGain = sumGain / period;
      const avgLoss = sumLoss / period;
      if (avgLoss === 0) {
        result.push(100);
      } else {
        const rs = avgGain / avgLoss;
        result.push(100 - (100 / (1 + rs)));
      }
    }
  }
  return result;
}

export interface BollingerBandsResult {
  middle: (number | null)[];
  upper: (number | null)[];
  lower: (number | null)[];
}

export function calculateBollingerBands(
  candles: Candle[],
  period: number = 20,
  stdDevMultiplier: number = 2
): BollingerBandsResult {
  const middle = calculateSMA(candles, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < candles.length; i++) {
    const sma = middle[i];
    if (sma === null || i < period - 1) {
      upper.push(null);
      lower.push(null);
    } else {
      let varianceSum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        const diff = candles[j].close - sma;
        varianceSum += diff * diff;
      }
      const stdDev = Math.sqrt(varianceSum / period);
      upper.push(sma + stdDevMultiplier * stdDev);
      lower.push(sma - stdDevMultiplier * stdDev);
    }
  }

  return { middle, upper, lower };
}
