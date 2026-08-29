// Helpers for the "simple intelligent search" required by the project.
// 1. Case-insensitive partial matching using regex
// 2. Spelling-tolerant matching using Levenshtein edit distance

const escapeRegex = (text = '') => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Classic dynamic-programming edit distance
const levenshtein = (a = '', b = '') => {
  a = a.toLowerCase();
  b = b.toLowerCase();
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;

  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[n];
};

// How close is the query to any word inside the medicine text?
const fuzzyScore = (query, text = '') => {
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase().trim();
  if (!q || !t) return Infinity;
  if (t.includes(q)) return 0;

  let best = levenshtein(q, t);
  for (const word of t.split(/\s+/)) {
    best = Math.min(best, levenshtein(q, word));
    // also compare against the same-length prefix so "paracetmol" ~ "paracetamol 500"
    if (word.length > q.length) best = Math.min(best, levenshtein(q, word.slice(0, q.length)));
  }
  return best;
};

// Allow more typos for longer words: 4 letters -> 1 typo, 8 letters -> 2, 12+ -> 3
const allowedDistance = (query) => {
  const len = query.trim().length;
  if (len <= 3) return 0;
  if (len <= 6) return 1;
  if (len <= 10) return 2;
  return 3;
};

module.exports = { escapeRegex, levenshtein, fuzzyScore, allowedDistance };
