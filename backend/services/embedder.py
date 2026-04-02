import numpy as np
from PIL import Image
import io

_model = None
_processor = None


def _load_clip():
    global _model, _processor
    if _model is None:
        from transformers import CLIPModel, CLIPProcessor
        from config import CLIP_MODEL_NAME
        print(f"Loading CLIP model: {CLIP_MODEL_NAME}")
        _processor = CLIPProcessor.from_pretrained(CLIP_MODEL_NAME)
        _model = CLIPModel.from_pretrained(CLIP_MODEL_NAME)
        _model.eval()
        print("CLIP model loaded.")


def _normalize(vec: np.ndarray) -> np.ndarray:
    norm = np.linalg.norm(vec)
    if norm == 0:
        return vec
    return (vec / norm).astype(np.float32)


def _pool_features(features) -> np.ndarray:
    """Handle different output shapes from transformers versions."""
    import torch
    # New transformers returns BaseModelOutputWithPooling — extract tensor
    if hasattr(features, "pooler_output") and features.pooler_output is not None:
        tensor = features.pooler_output
    elif hasattr(features, "last_hidden_state"):
        tensor = features.last_hidden_state.mean(dim=1)
    elif isinstance(features, torch.Tensor):
        tensor = features
    else:
        raise ValueError(f"Unexpected features type: {type(features)}")

    arr = tensor.cpu().numpy()
    # Flatten to 1-D (mean-pool any remaining sequence dim)
    while arr.ndim > 1:
        arr = arr.mean(axis=0)
    return arr.astype(np.float32)


def embed_text(text: str) -> np.ndarray:
    import torch
    _load_clip()
    inputs = _processor(text=[text], return_tensors="pt", padding=True, truncation=True, max_length=77)
    with torch.no_grad():
        features = _model.get_text_features(**inputs)
    vec = _pool_features(features)
    return _normalize(vec)


def embed_image(image_bytes: bytes) -> np.ndarray:
    import torch
    _load_clip()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    inputs = _processor(images=image, return_tensors="pt")
    with torch.no_grad():
        features = _model.get_image_features(**inputs)
    vec = _pool_features(features)
    return _normalize(vec)
