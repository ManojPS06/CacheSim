import styles from './PolicyCard.module.css';

const POLICY_COLORS = {
  LRU:   '#2563eb',
  LFU:   '#10b981',
  FIFO:  '#f59e0b',
  Clock: '#8b5cf6',
};

export default function PolicyCard({ name, result, capacity, step }) {
  if (!result) return (
    <div className={styles.card}>
      <div className={styles.header} style={{ borderColor: POLICY_COLORS[name] }}>
        <span className={styles.name}>{name}</span>
      </div>
      <div className={styles.empty}>Run simulation to see results</div>
    </div>
  );

  const total = result.hits + result.misses;
  const hitRate = total ? ((result.hits / total) * 100).toFixed(1) : '0.0';
  const currentStep = step !== null && result.stats[step];
  const currentCache = currentStep ? currentStep.cache : result.finalCache;

  return (
    <div className={styles.card}>
      <div className={styles.header} style={{ borderColor: POLICY_COLORS[name] }}>
        <span className={styles.name}>{name}</span>
        <span className={styles.hitRate} style={{ color: POLICY_COLORS[name] }}>{hitRate}% hit rate</span>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statVal} style={{ color: '#10b981' }}>{result.hits}</span>
          <span className={styles.statLabel}>Hits</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statVal} style={{ color: '#ef4444' }}>{result.misses}</span>
          <span className={styles.statLabel}>Misses</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statVal} style={{ color: '#f59e0b' }}>{result.evictions}</span>
          <span className={styles.statLabel}>Evictions</span>
        </div>
      </div>

      {/* Hit rate bar */}
      <div className={styles.barTrack}>
        <div className={styles.barFill} style={{ width: `${hitRate}%`, background: POLICY_COLORS[name] }} />
      </div>

      {/* Cache state */}
      <div className={styles.cacheLabel}>Cache State ({currentCache.length}/{capacity})</div>
      <div className={styles.cacheSlots}>
        {Array.from({ length: capacity }, (_, i) => {
          const page = currentCache[i];
          const isNew = currentStep && !currentStep.hit && currentStep.page === page;
          const isEvicted = currentStep && currentStep.evicted === currentCache[i];
          return (
            <div key={i} className={styles.slot}
              style={{ background: page !== undefined ? (isNew ? POLICY_COLORS[name] : '#1e3a5f') : '#1e293b', border: `1px solid ${page !== undefined ? POLICY_COLORS[name] + '66' : '#334155'}` }}>
              {page !== undefined ? `P${page}` : '—'}
            </div>
          );
        })}
      </div>

      {/* Current access */}
      {currentStep && (
        <div className={styles.access}>
          <span>Access: <strong>P{currentStep.page}</strong></span>
          <span className={currentStep.hit ? styles.hit : styles.miss}>{currentStep.hit ? '✓ HIT' : '✗ MISS'}</span>
          {currentStep.evicted !== null && <span className={styles.evict}>evicted P{currentStep.evicted}</span>}
        </div>
      )}
    </div>
  );
}
