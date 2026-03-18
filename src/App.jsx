import { useState, useRef, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  simulateLRU, simulateLFU, simulateFIFO, simulateClock,
  generateZipfTrace, generateUniformTrace, generateSequentialTrace
} from './algorithms/cache';
import PolicyCard from './components/PolicyCard';
import styles from './App.module.css';

const POLICIES = ['LRU', 'LFU', 'FIFO', 'Clock'];
const POLICY_COLORS = { LRU: '#2563eb', LFU: '#10b981', FIFO: '#f59e0b', Clock: '#8b5cf6' };
const SIMULATORS = { LRU: simulateLRU, LFU: simulateLFU, FIFO: simulateFIFO, Clock: simulateClock };
const TRACE_LABELS = { zipf: 'Zipf (Real-world)', uniform: 'Uniform Random', sequential: 'Sequential' };

function buildHitRateChart(results, traceLength) {
  if (!results.LRU) return [];
  const step = Math.max(1, Math.floor(traceLength / 50));
  return Array.from({ length: Math.floor(traceLength / step) }, (_, i) => {
    const idx = (i + 1) * step;
    const point = { step: idx };
    for (const name of POLICIES) {
      const r = results[name];
      if (!r) continue;
      const slice = r.stats.slice(0, idx);
      const hits = slice.filter(s => s.hit).length;
      point[name] = +((hits / slice.length) * 100).toFixed(1);
    }
    return point;
  });
}

export default function App() {
  const [capacity, setCapacity] = useState(4);
  const [pages, setPages] = useState(12);
  const [traceLen, setTraceLen] = useState(100);
  const [traceType, setTraceType] = useState('zipf');
  const [results, setResults] = useState({});
  const [trace, setTrace] = useState([]);
  const [step, setStep] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(80);
  const timerRef = useRef(null);

  function generateAndRun() {
    stopPlay();
    const generators = { zipf: generateZipfTrace, uniform: generateUniformTrace, sequential: generateSequentialTrace };
    const t = generators[traceType](pages, traceLen);
    setTrace(t);
    const res = {};
    for (const name of POLICIES) res[name] = SIMULATORS[name](t, capacity);
    setResults(res);
    setStep(null);
  }

  function stopPlay() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPlaying(false);
  }

  function play() {
    if (!trace.length) return;
    stopPlay();
    setPlaying(true);
    let i = step !== null ? step + 1 : 0;
    const tick = () => {
      if (i >= trace.length) { setPlaying(false); setStep(trace.length - 1); return; }
      setStep(i++);
      timerRef.current = setTimeout(tick, Math.max(20, 300 - speed * 2.8));
    };
    tick();
  }

  function reset() { stopPlay(); setStep(null); }

  const chartData = buildHitRateChart(results, traceLen);
  const hasResults = Object.keys(results).length > 0;

  return (
    <div className={styles.app}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.logo}>Cache<span className={styles.accent}>Sim</span></span>
          <span className={styles.subtitle}>Page Replacement Policy Benchmarker</span>
        </div>
        <div className={styles.tags}>
          {['LRU', 'LFU', 'FIFO', 'Clock'].map(p => (
            <span key={p} className={styles.tag} style={{ color: POLICY_COLORS[p], borderColor: POLICY_COLORS[p] + '44' }}>{p}</span>
          ))}
        </div>
      </header>

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Access Pattern</label>
          <div className={styles.traceRow}>
            {Object.entries(TRACE_LABELS).map(([k, v]) => (
              <button key={k} onClick={() => setTraceType(k)}
                className={traceType === k ? styles.activeBtn : styles.btn}>{v}</button>
            ))}
          </div>
        </div>

        <div className={styles.sliders}>
          {[
            { label: 'Cache Size', val: capacity, min: 2, max: 16, set: setCapacity },
            { label: 'Page Pool', val: pages, min: 5, max: 30, set: setPages },
            { label: 'Trace Length', val: traceLen, min: 20, max: 300, set: setTraceLen },
          ].map(({ label, val, min, max, set }) => (
            <label key={label} className={styles.sliderLabel}>
              {label} <span className={styles.sliderVal}>{val}</span>
              <input type="range" min={min} max={max} value={val} onChange={e => set(+e.target.value)} />
            </label>
          ))}
        </div>

        <div className={styles.actions}>
          <button className={styles.runBtn} onClick={generateAndRun}>Generate & Run</button>
          {hasResults && (
            <>
              <label className={styles.sliderLabel}>
                Speed
                <input type="range" min={1} max={100} value={speed} onChange={e => setSpeed(+e.target.value)} />
              </label>
              <button className={playing ? styles.stopBtn : styles.playBtn} onClick={playing ? stopPlay : play}>
                {playing ? '⏹ Stop' : '▶ Play'}
              </button>
              <button className={styles.resetBtn} onClick={reset}>Reset</button>
            </>
          )}
        </div>
      </div>

      {/* Trace preview */}
      {trace.length > 0 && (
        <div className={styles.traceBar}>
          <span className={styles.traceLabel}>Access Trace</span>
          <div className={styles.traceSlots}>
            {trace.slice(0, 60).map((p, i) => (
              <div key={i} className={styles.traceSlot}
                style={{ background: i === step ? '#2563eb' : '#1e293b', color: i === step ? '#fff' : '#64748b', fontWeight: i === step ? 700 : 400 }}>
                P{p}
              </div>
            ))}
            {trace.length > 60 && <span className={styles.traceMore}>+{trace.length - 60} more</span>}
          </div>
        </div>
      )}

      {/* Policy cards */}
      <div className={styles.grid}>
        {POLICIES.map(name => (
          <PolicyCard key={name} name={name} result={results[name] || null} capacity={capacity} step={step} />
        ))}
      </div>

      {/* Hit rate over time chart */}
      {chartData.length > 0 && (
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Hit Rate Over Time (%)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <XAxis dataKey="step" tick={{ fontSize: 11, fill: '#64748b' }} label={{ value: 'Accesses', position: 'insideBottom', offset: -2, fill: '#64748b', fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
              <Tooltip formatter={(v) => `${v}%`} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: '0.82rem' }} />
              {POLICIES.map(name => (
                <Line key={name} type="monotone" dataKey={name} stroke={POLICY_COLORS[name]} dot={false} strokeWidth={2} />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <p className={styles.chartNote}>
            Zipf distribution: top {Math.ceil(pages * 0.2)} pages receive ~80% of accesses — simulating real-world cache behaviour (CDNs, Redis, browser caches).
          </p>
        </div>
      )}

      {/* Info section */}
      <div className={styles.infoGrid}>
        {[
          { name: 'LRU', color: POLICY_COLORS.LRU, desc: 'Evicts the Least Recently Used page. Assumes recently accessed pages are likely to be accessed again. Works well for temporal locality.' },
          { name: 'LFU', color: POLICY_COLORS.LFU, desc: 'Evicts the Least Frequently Used page. Favours popular pages over time. Can be slow to adapt to changing access patterns.' },
          { name: 'FIFO', color: POLICY_COLORS.FIFO, desc: 'Evicts the oldest page regardless of usage. Simple but ignores access patterns. Can suffer from Belady\'s anomaly.' },
          { name: 'Clock', color: POLICY_COLORS.Clock, desc: 'Approximates LRU using a circular buffer and reference bits. Low overhead — used in real OS implementations (Linux page daemon).' },
        ].map(({ name, color, desc }) => (
          <div key={name} className={styles.infoCard} style={{ borderColor: color + '44' }}>
            <span className={styles.infoName} style={{ color }}>{name}</span>
            <p className={styles.infoDesc}>{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
