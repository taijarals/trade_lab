import Decimal from 'decimal.js';
import { Candle, SimulationConfig, Trade, Metrics, EquityPoint, SimulationDatasetResult, SimulationResult } from '../types';
import { generateSignals } from './strategies';

export function runBacktestDataset(
  candles: Candle[],
  config: SimulationConfig,
  isBenchmark: boolean = false
): SimulationDatasetResult {
  if (candles.length === 0) {
    const emptyMetrics: Metrics = {
      initialCapital: config.initialCapital,
      finalCapital: config.initialCapital,
      totalReturnPct: 0,
      vsBenchmarkPct: 0,
      maxDrawdownPct: 0,
      totalTrades: 0,
      winRatePct: 0,
      avgWinPct: 0,
      avgLossPct: 0,
      totalFeesPaid: 0,
      sharpeRatio: 0,
    };
    return { candles: [], trades: [], equityCurve: [], metrics: emptyMetrics, benchmarkMetrics: emptyMetrics };
  }

  let cashBrl = new Decimal(config.initialCapital);
  let cryptoQty = new Decimal(0);
  const trades: Trade[] = [];
  const equityCurve: EquityPoint[] = [];

  const feeRate = new Decimal(config.feePct).div(100);
  const slipRate = new Decimal(config.slippagePct).div(100);

  // If benchmark (Buy & Hold), buy 100% on candle 0 open
  let signals: string[] = [];
  if (isBenchmark) {
    signals = new Array(candles.length).fill('HOLD');
    if (candles.length > 0) {
      signals[0] = 'BUY';
    }
  } else {
    signals = generateSignals(candles, config.strategyType, config.params);
  }

  let inPosition = false;
  let entryPrice = new Decimal(0);

  const stopLossPct = config.params.stopLossPct ? new Decimal(config.params.stopLossPct).div(100) : null;
  const takeProfitPct = config.params.takeProfitPct ? new Decimal(config.params.takeProfitPct).div(100) : null;

  for (let i = 0; i < candles.length; i++) {
    const candle = candles[i];
    const currentPrice = new Decimal(candle.close);

    // Check stop loss or take profit during the candle if in position
    if (inPosition && !isBenchmark && (stopLossPct || takeProfitPct)) {
      const lowPrice = new Decimal(candle.low);
      const highPrice = new Decimal(candle.high);

      let exitTriggered = false;
      let exitReason: 'STOP_LOSS' | 'TAKE_PROFIT' = 'STOP_LOSS';
      let triggerPrice = currentPrice;

      if (stopLossPct) {
        const slPrice = entryPrice.mul(new Decimal(1).sub(stopLossPct));
        if (lowPrice.lte(slPrice)) {
          exitTriggered = true;
          exitReason = 'STOP_LOSS';
          triggerPrice = slPrice;
        }
      }
      if (!exitTriggered && takeProfitPct) {
        const tpPrice = entryPrice.mul(new Decimal(1).add(takeProfitPct));
        if (highPrice.gte(tpPrice)) {
          exitTriggered = true;
          exitReason = 'TAKE_PROFIT';
          triggerPrice = tpPrice;
        }
      }

      if (exitTriggered && cryptoQty.gt(0)) {
        const execPrice = triggerPrice.mul(new Decimal(1).sub(slipRate));
        const grossBrl = cryptoQty.mul(execPrice);
        const fee = grossBrl.mul(feeRate);
        const netBrl = grossBrl.sub(fee);

        cashBrl = cashBrl.add(netBrl);
        const soldQty = cryptoQty;
        cryptoQty = new Decimal(0);
        inPosition = false;

        trades.push({
          id: `trade_${i}_${Math.random().toString(36).substr(2, 5)}`,
          candleIndex: i,
          timestamp: candle.timestamp,
          dateStr: candle.dateStr,
          type: 'SELL',
          price: execPrice.toDecimalPlaces(2).toNumber(),
          quantity: soldQty.toDecimalPlaces(8).toNumber(),
          fee: fee.toDecimalPlaces(2).toNumber(),
          totalBrl: netBrl.toDecimalPlaces(2).toNumber(),
          balanceBrl: cashBrl.toDecimalPlaces(2).toNumber(),
          balanceCrypto: 0,
          reason: exitReason,
        });
      }
    }

    // Process signal for next candle execution (or current if candle 0 benchmark)
    // No lookahead rule: signal evaluated at close of candle i, executed at open of candle i+1 (or open of i for benchmark candle 0)
    if (i < candles.length - 1) {
      const nextCandle = candles[i + 1];
      const signal = signals[i];

      if (signal === 'BUY') {
        if (config.strategyType === 'dca') {
          // DCA: Buy fixed amount (or available cash)
          const dcaVal = new Decimal(config.params.dcaAmount || 100);
          const spend = cashBrl.gte(dcaVal) ? dcaVal : cashBrl;
          if (spend.gt(10)) {
            const execPrice = new Decimal(nextCandle.open).mul(new Decimal(1).add(slipRate));
            const fee = spend.mul(feeRate);
            const netSpend = spend.sub(fee);
            const boughtQty = netSpend.div(execPrice);

            cashBrl = cashBrl.sub(spend);
            cryptoQty = cryptoQty.add(boughtQty);
            inPosition = true;
            entryPrice = execPrice;

            trades.push({
              id: `trade_${i}_dca`,
              candleIndex: i + 1,
              timestamp: nextCandle.timestamp,
              dateStr: nextCandle.dateStr,
              type: 'BUY',
              price: execPrice.toDecimalPlaces(2).toNumber(),
              quantity: boughtQty.toDecimalPlaces(8).toNumber(),
              fee: fee.toDecimalPlaces(2).toNumber(),
              totalBrl: spend.toDecimalPlaces(2).toNumber(),
              balanceBrl: cashBrl.toDecimalPlaces(2).toNumber(),
              balanceCrypto: cryptoQty.toDecimalPlaces(8).toNumber(),
              reason: 'SIGNAL',
            });
          }
        } else if (!inPosition && cashBrl.gt(10)) {
          // Buy 100% available cash
          const spend = cashBrl;
          const execPrice = new Decimal(nextCandle.open).mul(new Decimal(1).add(slipRate));
          const fee = spend.mul(feeRate);
          const netSpend = spend.sub(fee);
          const boughtQty = netSpend.div(execPrice);

          cashBrl = cashBrl.sub(spend);
          cryptoQty = cryptoQty.add(boughtQty);
          inPosition = true;
          entryPrice = execPrice;

          trades.push({
            id: `trade_${i}_buy`,
            candleIndex: i + 1,
            timestamp: nextCandle.timestamp,
            dateStr: nextCandle.dateStr,
            type: 'BUY',
            price: execPrice.toDecimalPlaces(2).toNumber(),
            quantity: boughtQty.toDecimalPlaces(8).toNumber(),
            fee: fee.toDecimalPlaces(2).toNumber(),
            totalBrl: spend.toDecimalPlaces(2).toNumber(),
            balanceBrl: cashBrl.toDecimalPlaces(2).toNumber(),
            balanceCrypto: cryptoQty.toDecimalPlaces(8).toNumber(),
            reason: 'SIGNAL',
          });
        }
      } else if (signal === 'SELL' && inPosition && config.strategyType !== 'dca') {
        const execPrice = new Decimal(nextCandle.open).mul(new Decimal(1).sub(slipRate));
        const grossBrl = cryptoQty.mul(execPrice);
        const fee = grossBrl.mul(feeRate);
        const netBrl = grossBrl.sub(fee);

        cashBrl = cashBrl.add(netBrl);
        const soldQty = cryptoQty;
        cryptoQty = new Decimal(0);
        inPosition = false;

        trades.push({
          id: `trade_${i}_sell`,
          candleIndex: i + 1,
          timestamp: nextCandle.timestamp,
          dateStr: nextCandle.dateStr,
          type: 'SELL',
          price: execPrice.toDecimalPlaces(2).toNumber(),
          quantity: soldQty.toDecimalPlaces(8).toNumber(),
          fee: fee.toDecimalPlaces(2).toNumber(),
          totalBrl: netBrl.toDecimalPlaces(2).toNumber(),
          balanceBrl: cashBrl.toDecimalPlaces(2).toNumber(),
          balanceCrypto: 0,
          reason: 'SIGNAL',
        });
      }
    }

    // Benchmark candle 0 buy execution
    if (isBenchmark && i === 0) {
      const spend = cashBrl;
      const execPrice = new Decimal(candle.open).mul(new Decimal(1).add(slipRate));
      const fee = spend.mul(feeRate);
      const netSpend = spend.sub(fee);
      const boughtQty = netSpend.div(execPrice);

      cashBrl = cashBrl.sub(spend);
      cryptoQty = cryptoQty.add(boughtQty);
      inPosition = true;
      entryPrice = execPrice;

      trades.push({
        id: `trade_0_bm`,
        candleIndex: 0,
        timestamp: candle.timestamp,
        dateStr: candle.dateStr,
        type: 'BUY',
        price: execPrice.toDecimalPlaces(2).toNumber(),
        quantity: boughtQty.toDecimalPlaces(8).toNumber(),
        fee: fee.toDecimalPlaces(2).toNumber(),
        totalBrl: spend.toDecimalPlaces(2).toNumber(),
        balanceBrl: cashBrl.toDecimalPlaces(2).toNumber(),
        balanceCrypto: cryptoQty.toDecimalPlaces(8).toNumber(),
        reason: 'SIGNAL',
      });
    }

    // Calculate total equity at this candle
    const totalEquity = cashBrl.add(cryptoQty.mul(currentPrice));
    equityCurve.push({
      timestamp: candle.timestamp,
      dateStr: candle.dateStr,
      equity: totalEquity.toDecimalPlaces(2).toNumber(),
      benchmarkEquity: 0, // Filled later
      price: currentPrice.toDecimalPlaces(2).toNumber(),
    });
  }

  // Final liquidation at last candle if still holding position
  if (inPosition && cryptoQty.gt(0) && candles.length > 0) {
    const lastCandle = candles[candles.length - 1];
    const execPrice = new Decimal(lastCandle.close).mul(new Decimal(1).sub(slipRate));
    const grossBrl = cryptoQty.mul(execPrice);
    const fee = grossBrl.mul(feeRate);
    const netBrl = grossBrl.sub(fee);

    cashBrl = cashBrl.add(netBrl);
    const soldQty = cryptoQty;
    cryptoQty = new Decimal(0);

    trades.push({
      id: `trade_final`,
      candleIndex: candles.length - 1,
      timestamp: lastCandle.timestamp,
      dateStr: lastCandle.dateStr,
      type: 'SELL',
      price: execPrice.toDecimalPlaces(2).toNumber(),
      quantity: soldQty.toDecimalPlaces(8).toNumber(),
      fee: fee.toDecimalPlaces(2).toNumber(),
      totalBrl: netBrl.toDecimalPlaces(2).toNumber(),
      balanceBrl: cashBrl.toDecimalPlaces(2).toNumber(),
      balanceCrypto: 0,
      reason: 'END',
    });

    // Update last equity point
    if (equityCurve.length > 0) {
      equityCurve[equityCurve.length - 1].equity = cashBrl.toDecimalPlaces(2).toNumber();
    }
  }

  const finalCapital = cashBrl.toDecimalPlaces(2).toNumber();
  const totalReturnPct = new Decimal(finalCapital)
    .sub(config.initialCapital)
    .div(config.initialCapital)
    .mul(100)
    .toDecimalPlaces(2)
    .toNumber();

  // Calculate Max Drawdown
  let peak = new Decimal(config.initialCapital);
  let maxDD = new Decimal(0);
  for (const pt of equityCurve) {
    const eq = new Decimal(pt.equity);
    if (eq.gt(peak)) {
      peak = eq;
    }
    const dd = peak.sub(eq).div(peak).mul(100);
    if (dd.gt(maxDD)) {
      maxDD = dd;
    }
  }

  // Win rate & avg win/loss
  let wins = 0;
  let lossesCount = 0;
  let totalWinPct = new Decimal(0);
  let totalLossPct = new Decimal(0);
  let totalFees = new Decimal(0);

  // Pair buys and sells for trade stats
  let lastBuyPrice = new Decimal(0);
  for (const t of trades) {
    totalFees = totalFees.add(t.fee);
    if (t.type === 'BUY') {
      lastBuyPrice = new Decimal(t.price);
    } else if (t.type === 'SELL' && lastBuyPrice.gt(0)) {
      const ret = new Decimal(t.price).sub(lastBuyPrice).div(lastBuyPrice).mul(100);
      if (ret.gt(0)) {
        wins++;
        totalWinPct = totalWinPct.add(ret);
      } else {
        lossesCount++;
        totalLossPct = totalLossPct.add(ret.abs());
      }
    }
  }

  const totalClosedTrades = wins + lossesCount;
  const winRatePct = totalClosedTrades > 0 ? new Decimal(wins).div(totalClosedTrades).mul(100).toDecimalPlaces(2).toNumber() : 0;
  const avgWinPct = wins > 0 ? totalWinPct.div(wins).toDecimalPlaces(2).toNumber() : 0;
  const avgLossPct = lossesCount > 0 ? totalLossPct.div(lossesCount).toDecimalPlaces(2).toNumber() : 0;

  // Sharpe ratio approximation (daily/period returns std dev)
  let sharpeRatio = 0;
  if (equityCurve.length > 2) {
    const returns: number[] = [];
    for (let i = 1; i < equityCurve.length; i++) {
      const prev = equityCurve[i - 1].equity;
      const curr = equityCurve[i].equity;
      if (prev > 0) {
        returns.push((curr - prev) / prev);
      }
    }
    if (returns.length > 0) {
      const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
      const stdDev = Math.sqrt(variance);
      if (stdDev > 0) {
        sharpeRatio = Number(((mean / stdDev) * Math.sqrt(252)).toFixed(2)); // annualized
      }
    }
  }

  const metrics: Metrics = {
    initialCapital: config.initialCapital,
    finalCapital,
    totalReturnPct,
    vsBenchmarkPct: 0, // Calculated after pairing with benchmark
    maxDrawdownPct: maxDD.toDecimalPlaces(2).toNumber(),
    totalTrades: trades.length,
    winRatePct,
    avgWinPct,
    avgLossPct,
    totalFeesPaid: totalFees.toDecimalPlaces(2).toNumber(),
    sharpeRatio,
  };

  return {
    candles,
    trades,
    equityCurve,
    metrics,
    benchmarkMetrics: metrics, // placeholder
  };
}

export function runFullSimulation(
  allCandles: Candle[],
  config: SimulationConfig
): SimulationResult {
  const n = allCandles.length;
  const trainEnd = Math.floor(n * config.trainRatio);
  const testEnd = trainEnd + Math.floor(n * config.testRatio);

  const trainCandles = allCandles.slice(0, trainEnd);
  const testCandles = allCandles.slice(trainEnd, testEnd);
  const valCandles = allCandles.slice(testEnd);

  // Run Strategy
  const trainRes = runBacktestDataset(trainCandles, config, false);
  const testRes = runBacktestDataset(testCandles, config, false);
  const valRes = runBacktestDataset(valCandles, config, false);

  // Run Benchmark
  const trainBm = runBacktestDataset(trainCandles, config, true);
  const testBm = runBacktestDataset(testCandles, config, true);
  const valBm = runBacktestDataset(valCandles, config, true);

  // Compare vs Benchmark
  trainRes.metrics.vsBenchmarkPct = Number((trainRes.metrics.totalReturnPct - trainBm.metrics.totalReturnPct).toFixed(2));
  testRes.metrics.vsBenchmarkPct = Number((testRes.metrics.totalReturnPct - testBm.metrics.totalReturnPct).toFixed(2));
  valRes.metrics.vsBenchmarkPct = Number((valRes.metrics.totalReturnPct - valBm.metrics.totalReturnPct).toFixed(2));

  // Attach benchmark equity to equity curves
  for (let i = 0; i < trainRes.equityCurve.length; i++) {
    trainRes.equityCurve[i].benchmarkEquity = trainBm.equityCurve[i]?.equity || config.initialCapital;
  }
  for (let i = 0; i < testRes.equityCurve.length; i++) {
    testRes.equityCurve[i].benchmarkEquity = testBm.equityCurve[i]?.equity || config.initialCapital;
  }
  for (let i = 0; i < valRes.equityCurve.length; i++) {
    valRes.equityCurve[i].benchmarkEquity = valBm.equityCurve[i]?.equity || config.initialCapital;
  }

  trainRes.benchmarkMetrics = trainBm.metrics;
  testRes.benchmarkMetrics = testBm.metrics;
  valRes.benchmarkMetrics = valBm.metrics;

  return {
    train: trainRes,
    test: testRes,
    validation: valRes,
    allCandles,
    validationUnlocked: false,
    validationUsageCount: 0,
  };
}
