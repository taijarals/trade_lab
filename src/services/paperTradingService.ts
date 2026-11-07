import { Candle, SimulationConfig, Trade } from '../types';
import { generateSignals } from '../engine/strategies';

export interface PaperSession {
  isRunning: boolean;
  market: string;
  capitalBrl: number;
  cryptoQty: number;
  entryPrice: number;
  trades: Trade[];
  currentPrice: number;
  lastUpdate: string;
}

export class PaperTradingManager {
  private timer: any = null;
  private session: PaperSession;
  private config: SimulationConfig;
  private candlesBuffer: Candle[] = [];
  private listener: (session: PaperSession) => void;

  constructor(config: SimulationConfig, initialCandles: Candle[], onUpdate: (s: PaperSession) => void) {
    this.config = config;
    this.candlesBuffer = [...initialCandles];
    this.listener = onUpdate;
    this.session = {
      isRunning: false,
      market: config.market,
      capitalBrl: config.initialCapital,
      cryptoQty: 0,
      entryPrice: 0,
      trades: [],
      currentPrice: initialCandles[initialCandles.length - 1]?.close || 100,
      lastUpdate: new Date().toLocaleTimeString('pt-BR'),
    };
  }

  public start() {
    if (this.session.isRunning) return;
    this.session.isRunning = true;
    this.listener(this.session);

    this.timer = setInterval(async () => {
      try {
        // Fetch live ticker from Foxbit or simulate tick
        let livePrice = this.session.currentPrice;
        try {
          const res = await fetch(`/api/foxbit/ticker?market=${this.config.market}`);
          if (res.ok) {
            const data = await res.json();
            const last = data.last_price || data.last || data.price;
            if (last) livePrice = Number(last);
          }
        } catch {
          // Fallback random micro-fluctuation
          const delta = (Math.random() - 0.49) * 0.002;
          livePrice = livePrice * (1 + delta);
        }

        const newCandle: Candle = {
          timestamp: Date.now(),
          open: this.session.currentPrice,
          high: Math.max(this.session.currentPrice, livePrice),
          low: Math.min(this.session.currentPrice, livePrice),
          close: livePrice,
          volume: 100,
          dateStr: new Date().toLocaleString('pt-BR'),
        };

        this.candlesBuffer.push(newCandle);
        if (this.candlesBuffer.length > 200) this.candlesBuffer.shift();

        // Check strategy signals on recent buffer
        const signals = generateSignals(this.candlesBuffer, this.config.strategyType, this.config.params);
        const latestSignal = signals[signals.length - 1];

        const slip = this.config.slippagePct / 100;
        const fee = this.config.feePct / 100;

        if (latestSignal === 'BUY' && this.session.cryptoQty === 0 && this.session.capitalBrl > 10) {
          const spend = this.session.capitalBrl;
          const execPrice = livePrice * (1 + slip);
          const feePaid = spend * fee;
          const netSpend = spend - feePaid;
          const qty = netSpend / execPrice;

          this.session.capitalBrl = 0;
          this.session.cryptoQty = qty;
          this.session.entryPrice = execPrice;

          this.session.trades.unshift({
            id: `paper_${Date.now()}`,
            candleIndex: this.candlesBuffer.length - 1,
            timestamp: Date.now(),
            dateStr: new Date().toLocaleTimeString('pt-BR'),
            type: 'BUY',
            price: Number(execPrice.toFixed(2)),
            quantity: Number(qty.toFixed(8)),
            fee: Number(feePaid.toFixed(2)),
            totalBrl: Number(spend.toFixed(2)),
            balanceBrl: 0,
            balanceCrypto: Number(qty.toFixed(8)),
            reason: 'SIGNAL',
          });
        } else if (latestSignal === 'SELL' && this.session.cryptoQty > 0) {
          const execPrice = livePrice * (1 - slip);
          const gross = this.session.cryptoQty * execPrice;
          const feePaid = gross * fee;
          const net = gross - feePaid;

          this.session.capitalBrl = net;
          const soldQty = this.session.cryptoQty;
          this.session.cryptoQty = 0;

          this.session.trades.unshift({
            id: `paper_${Date.now()}`,
            candleIndex: this.candlesBuffer.length - 1,
            timestamp: Date.now(),
            dateStr: new Date().toLocaleTimeString('pt-BR'),
            type: 'SELL',
            price: Number(execPrice.toFixed(2)),
            quantity: Number(soldQty.toFixed(8)),
            fee: Number(feePaid.toFixed(2)),
            totalBrl: Number(net.toFixed(2)),
            balanceBrl: Number(net.toFixed(2)),
            balanceCrypto: 0,
            reason: 'SIGNAL',
          });
        }

        this.session.currentPrice = Number(livePrice.toFixed(4));
        this.session.lastUpdate = new Date().toLocaleTimeString('pt-BR');
        this.listener({ ...this.session });
      } catch (err) {
        console.error('Paper trading tick error:', err);
      }
    }, 5000); // every 5s
  }

  public stop() {
    if (this.timer) clearInterval(this.timer);
    this.session.isRunning = false;
    this.listener({ ...this.session });
  }

  public getSession(): PaperSession {
    return this.session;
  }
}
