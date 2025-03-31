import logging

import numpy as np
from fastapi import APIRouter

from app.dependencies import nlp_models
from app.schemas.models import CompareRequest

router = APIRouter(prefix="/api/v1/semantic", tags=["Semantic"])

logger = logging.getLogger(__name__)

def get_word_vector(word, model):
    print(f"Первые 20 слов: {list(model.key_to_index.keys())[:20]}")
    try:
        return model[word]
    except KeyError:
        return np.zeros(model.vector_size)  # если слова нет в модели

def cosine_similarity(vec1, vec2):
    return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))

@router.post("/similarity/")
async def semantic_similarity(request: CompareRequest):
    word1 = request.word1
    word2 = request.word2
    print(word1)
    print(word2)
    vec1 = get_word_vector(word1, nlp_models.word2Vec)
    vec2 = get_word_vector(word2, nlp_models.word2Vec)
    print(vec1)
    print(vec2)

    similarity = cosine_similarity(vec1, vec2)

    return {"similarity": float(similarity)}