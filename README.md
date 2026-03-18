# CacheSim — Cache Policy Simulator & Benchmarker

An interactive benchmarking tool that runs LRU, LFU, FIFO, and Clock page replacement algorithms side-by-side on configurable access traces — including Zipf distribution which models real-world cache behaviour.

## Features

- **4 Policies compared simultaneously** — LRU, LFU, FIFO, Clock (Second Chance)
- **3 Access patterns** — Zipf (real-world), Uniform random, Sequential
- **Live cache state** — watch each policy's cache slots update step-by-step via playback
- **Hit rate chart** — see how each policy's hit rate evolves over the access trace
- **Configurable** — adjust cache size, page pool size, and trace length
- **Algorithm descriptions** — explains real-world usage (Linux page daemon, Redis, CDNs)

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173`

## Why Zipf?

Real-world access patterns follow a power law (Zipf distribution) — a small number of pages receive most of the requests. This is true for:
- Web pages (a few pages get most traffic)
- Database queries (a few hot rows get most reads)
- CDN caches (popular content dominates)
- Redis/Memcached (a small keyset is accessed repeatedly)

Uniform random access is the worst case for caching — in practice, Zipf distribution allows caches to be far more effective.

## Algorithms

| Policy | Evicts | Real-world use |
|--------|--------|----------------|
| LRU | Least Recently Used | Browser cache, database buffer pool |
| LFU | Least Frequently Used | CDN caches, Redis with LFU mode |
| FIFO | Oldest inserted | Simple queue-based systems |
| Clock | Approximates LRU | Linux page frame replacement, OS kernels |

## Tech Stack

- React 18, Vite
- Recharts (hit rate chart)
- CSS Modules
- All cache algorithms implemented from scratch

## Motivation

Built while studying OS page replacement algorithms at PES University. The goal was to understand the practical performance trade-offs between policies on realistic (Zipf-distributed) access patterns — as opposed to the worst-case traces typically used in textbook examples.
