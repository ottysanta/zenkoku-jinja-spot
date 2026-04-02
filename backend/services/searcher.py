import numpy as np
import faiss
from config import FAISS_INDEX_PATH

_index: faiss.IndexFlatIP | None = None


def build_index(embeddings: list[np.ndarray]) -> None:
    if not embeddings:
        raise ValueError("Cannot build index with empty embeddings list.")
    dim = embeddings[0].shape[0]
    index = faiss.IndexFlatIP(dim)
    matrix = np.stack(embeddings).astype(np.float32)
    index.add(matrix)
    faiss.write_index(index, str(FAISS_INDEX_PATH))
    global _index
    _index = index
    print(f"FAISS index built with {index.ntotal} vectors (dim={dim}).")


def load_index() -> faiss.IndexFlatIP:
    global _index
    if _index is not None:
        return _index
    if not FAISS_INDEX_PATH.exists():
        raise FileNotFoundError(
            f"FAISS index not found at {FAISS_INDEX_PATH}. Run seed.py first."
        )
    _index = faiss.read_index(str(FAISS_INDEX_PATH))
    print(f"FAISS index loaded: {_index.ntotal} vectors.")
    return _index


def search(query_vector: np.ndarray, top_k: int = 3) -> list[tuple[int, float]]:
    index = load_index()
    query = query_vector.reshape(1, -1).astype(np.float32)
    scores, ids = index.search(query, top_k)
    return [(int(ids[0][i]), float(scores[0][i])) for i in range(top_k) if ids[0][i] >= 0]


def get_index_size() -> int:
    try:
        idx = load_index()
        return idx.ntotal
    except FileNotFoundError:
        return 0
