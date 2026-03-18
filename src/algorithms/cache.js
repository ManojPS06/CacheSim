// Returns { hits, misses, evictions, finalCache } for a given trace + capacity

export function simulateLRU(trace, capacity) {
  const cache = [], stats = [];
  let hits = 0, misses = 0, evictions = 0;
  for (const page of trace) {
    const idx = cache.indexOf(page);
    if (idx !== -1) {
      hits++;
      cache.splice(idx, 1);
      cache.push(page);
      stats.push({ page, hit: true, evicted: null, cache: [...cache] });
    } else {
      misses++;
      let evicted = null;
      if (cache.length >= capacity) { evicted = cache.shift(); evictions++; }
      cache.push(page);
      stats.push({ page, hit: false, evicted, cache: [...cache] });
    }
  }
  return { hits, misses, evictions, finalCache: [...cache], stats };
}

export function simulateLFU(trace, capacity) {
  const cache = new Map(); // page -> freq
  const stats = [];
  let hits = 0, misses = 0, evictions = 0;
  for (const page of trace) {
    if (cache.has(page)) {
      hits++;
      cache.set(page, cache.get(page) + 1);
      stats.push({ page, hit: true, evicted: null, cache: [...cache.keys()] });
    } else {
      misses++;
      let evicted = null;
      if (cache.size >= capacity) {
        // evict least frequently used (ties broken by insertion order)
        let minFreq = Infinity, minPage = null;
        for (const [p, f] of cache) { if (f < minFreq) { minFreq = f; minPage = p; } }
        cache.delete(minPage);
        evicted = minPage;
        evictions++;
      }
      cache.set(page, 1);
      stats.push({ page, hit: false, evicted, cache: [...cache.keys()] });
    }
  }
  return { hits, misses, evictions, finalCache: [...cache.keys()], stats };
}

export function simulateFIFO(trace, capacity) {
  const cache = [], stats = [];
  let hits = 0, misses = 0, evictions = 0;
  for (const page of trace) {
    if (cache.includes(page)) {
      hits++;
      stats.push({ page, hit: true, evicted: null, cache: [...cache] });
    } else {
      misses++;
      let evicted = null;
      if (cache.length >= capacity) { evicted = cache.shift(); evictions++; }
      cache.push(page);
      stats.push({ page, hit: false, evicted, cache: [...cache] });
    }
  }
  return { hits, misses, evictions, finalCache: [...cache], stats };
}

export function simulateClock(trace, capacity) {
  // Clock (Second Chance) algorithm
  const frames = new Array(capacity).fill(null);
  const refBits = new Array(capacity).fill(0);
  let hand = 0;
  const stats = [];
  let hits = 0, misses = 0, evictions = 0;

  for (const page of trace) {
    const idx = frames.indexOf(page);
    if (idx !== -1) {
      hits++;
      refBits[idx] = 1;
      stats.push({ page, hit: true, evicted: null, cache: frames.filter(Boolean) });
    } else {
      misses++;
      let evicted = null;
      // find victim
      while (refBits[hand] === 1) { refBits[hand] = 0; hand = (hand + 1) % capacity; }
      if (frames[hand] !== null) { evicted = frames[hand]; evictions++; }
      frames[hand] = page;
      refBits[hand] = 1;
      hand = (hand + 1) % capacity;
      stats.push({ page, hit: false, evicted, cache: frames.filter(Boolean) });
    }
  }
  return { hits, misses, evictions, finalCache: frames.filter(Boolean), stats };
}

// Zipf distribution access trace generator
export function generateZipfTrace(pages, length, skew = 1.2) {
  // Compute Zipf probabilities
  const weights = Array.from({ length: pages }, (_, i) => 1 / Math.pow(i + 1, skew));
  const total = weights.reduce((a, b) => a + b, 0);
  const cumulative = [];
  let sum = 0;
  for (const w of weights) { sum += w / total; cumulative.push(sum); }

  const trace = [];
  for (let i = 0; i < length; i++) {
    const r = Math.random();
    const idx = cumulative.findIndex((c) => r <= c);
    trace.push(idx === -1 ? pages - 1 : idx);
  }
  return trace;
}

// Uniform random trace
export function generateUniformTrace(pages, length) {
  return Array.from({ length }, () => Math.floor(Math.random() * pages));
}

// Sequential (looping) trace
export function generateSequentialTrace(pages, length) {
  return Array.from({ length }, (_, i) => i % pages);
}
