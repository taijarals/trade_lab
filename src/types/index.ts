export type Market = 'xrpbrl' | 'btcbrl' | 'ethbrl' | 'ltcbrl';
export type Timeframe = '15m' | '1h' | '4h' | '1d';

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  dateStr: string;
}

export type StrategyType = 'sma_crossover' | 'rsi' | 'bollinger' | 'dca';

export interface StrategyParams {
  // SMA Crossover
  shortPeriod?: number;
  longPeriod?: number;
  // RSI
  rsiPeriod?: number;
  oversold?: number;
  overbought?: number;
  // Bollinger Bands
  bollingerPeriod?: number;
  bollingerStdDev?: number;
  // DCA
  dcaAmount?: number;
  dcaInterval?: number; // every N candles
  // Optional Risk Management
  stopLossPct?: number; // e.g., 5%
  takeProfitPct?: number; // e.g., 10%
}

export interface SimulationConfig {
  market: Market;
  timeframe: Timeframe;
  strategyType: StrategyType;
  params: StrategyParams;
  initialCapital: number;
  feePct: number; // default 0.5%
  slippagePct: number; // default 0.1%
  trainRatio: number; // default 0.6
  testRatio: number; // default 0.2
  validationRatio: number; // default 0.2
}

export interface Trade {
  id: string;
  candleIndex: number;
  timestamp: number;
  dateStr: string;
  type: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  fee: number;
  totalBrl: number;
  balanceBrl: number;
  balanceCrypto: number;
  reason: 'SIGNAL' | 'STOP_LOSS' | 'TAKE_PROFIT' | 'END';
}

export interface Metrics {
  initialCapital: number;
  finalCapital: number;
  totalReturnPct: number;
  vsBenchmarkPct: number;
  maxDrawdownPct: number;
  totalTrades: number;
  winRatePct: number;
  avgWinPct: number;
  avgLossPct: number;
  totalFeesPaid: number;
  sharpeRatio: number;
}

export interface EquityPoint {
  timestamp: number;
  dateStr: string;
  equity: number;
  benchmarkEquity: number;
  price: number;
}

export interface SimulationDatasetResult {
  candles: Candle[];
  trades: Trade[];
  equityCurve: EquityPoint[];
  metrics: Metrics;
  benchmarkMetrics: Metrics;
}

export interface SimulationResult {
  train: SimulationDatasetResult;
  test: SimulationDatasetResult;
  validation: SimulationDatasetResult;
  allCandles: Candle[];
  validationUnlocked: boolean;
  validationUsageCount: number;
}

export interface AIHypothesis {
  title: string;
  justification: string;
  params: StrategyParams;
  riskEvaluation: string;
}

export interface AIAnalysis {
  diagnosis: string;
  hypotheses: AIHypothesis[];
}

export interface Experiment {
  id: string;
  name: string;
  timestamp: number;
  notes: string;
  config: SimulationConfig;
  trainMetrics: Metrics;
  testMetrics: Metrics;
  trainTradesCount: number;
  testTradesCount: number;
  aiAnalysis?: AIAnalysis;
  iterationsCount: number;
}

export interface GridSearchRow {
  params: StrategyParams;
  trainReturn: number;
  testReturn: number;
  sharpe: number;
  winRate: number;
  maxDrawdown: number;
}
