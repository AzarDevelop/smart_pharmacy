"""
Intelligent Medicine Search (Module 4: AI & ML)
-------------------------------------------------
Resolves a free-text, possibly misspelled or differently-formatted user
query (e.g. "paracitamol", "para 500", "crocin") to the closest matching
medicine(s) in the pharmacy's catalogue.

Two strategies are combined:
1. Semantic similarity using a sentence-transformer embedding model, which
   understands meaning/formatting differences (e.g. "pain relief tablet"
   matching "Paracetamol 500mg").
2. Fuzzy string matching (RapidFuzz) as a fast, robust fallback and to
   catch pure spelling mistakes the embedding model might miss.

The two scores are blended so the search is tolerant of both typos and
natural-language phrasing.
"""

from rapidfuzz import fuzz

_model = None


def _get_model():
    """Lazily load the sentence-transformer model (heavy import)."""
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _model = SentenceTransformer('all-MiniLM-L6-v2')
        except Exception as exc:  # pragma: no cover
            print(f"[nlp_search] Could not load embedding model, using fuzzy-only mode: {exc}")
            _model = False
    return _model


def _fuzzy_score(query: str, candidate: str) -> float:
    q, c = query.lower().strip(), candidate.lower().strip()
    return fuzz.token_set_ratio(q, c) / 100.0


def search(query: str, catalogue: list, top_k: int = 8, threshold: float = 0.45):
    """
    query: user's free text search term
    catalogue: list of {id, name, generic_name}
    returns: list of {id, name, score} sorted by best match first
    """
    if not catalogue:
        return []

    candidates = [f"{m.get('name', '')} {m.get('generic_name', '') or ''}".strip() for m in catalogue]

    model = _get_model()
    semantic_scores = None
    if model:
        try:
            import numpy as np
            embeddings = model.encode([query] + candidates, normalize_embeddings=True)
            query_vec, cand_vecs = embeddings[0], embeddings[1:]
            semantic_scores = cand_vecs @ query_vec  # cosine similarity (already normalized)
        except Exception as exc:  # pragma: no cover
            print(f"[nlp_search] Embedding scoring failed, fuzzy-only: {exc}")
            semantic_scores = None

    results = []
    for i, med in enumerate(catalogue):
        fuzzy = _fuzzy_score(query, candidates[i])
        if semantic_scores is not None:
            blended = 0.6 * float(semantic_scores[i]) + 0.4 * fuzzy
        else:
            blended = fuzzy
        results.append({"id": med["id"], "name": med["name"], "score": round(blended, 3)})

    results.sort(key=lambda r: r["score"], reverse=True)
    filtered = [r for r in results if r["score"] >= threshold]

    # Always return at least the single best match even if below threshold,
    # so the user gets a "closest match" instead of an empty result.
    return (filtered or results[:1])[:top_k]
