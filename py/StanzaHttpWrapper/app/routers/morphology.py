from typing import Dict

from fastapi import APIRouter, HTTPException, status
from app.schemas.models import (
    LemmaRequest,
    MorphFeaturesResponse,
    InflectRequest,
    InflectResponse
)
from app.dependencies import nlp_models
from app.utils.tags import parse_features, map_tags_to_pymorphy
import logging

router = APIRouter(prefix="/api/v1/morph", tags=["Morphology"])
logger = logging.getLogger(__name__)


@router.post("/lemma", response_model=Dict[str, str])
async def get_lemma(request: LemmaRequest):
    """Получение леммы слова"""
    try:
        doc = nlp_models.get_pipeline('lemma')(request.word)
        if doc.sentences and doc.sentences[0].words:
            return {"lemma": doc.sentences[0].words[0].lemma}
        return {"lemma": request.word}
    except Exception as e:
        logger.error(f"Lemma error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ошибка лемматизации"
        )


@router.post("/features", response_model=MorphFeaturesResponse)
async def get_morph_features(request: LemmaRequest):
    """Анализ морфологических признаков"""
    try:
        doc = nlp_models.get_pipeline('lemma')(request.word)
        features = {}
        if doc.sentences and doc.sentences[0].words:
            for feat in doc.sentences[0].words[0].feats.split('|'):
                if '=' in feat:
                    key, val = feat.split('=', 1)
                    features[key] = val
        return MorphFeaturesResponse(word=request.word, features=features)
    except Exception as e:
        logger.error(f"Features error: {str(e)}")
        return MorphFeaturesResponse(word=request.word, features={})


@router.post("/inflect", response_model=InflectResponse)
async def inflect_word(request: InflectRequest):
    """Генерация словоформы"""
    try:
        features = parse_features(request.features, request.features_str)
        pymorphy_tags = map_tags_to_pymorphy(features)

        parsed = nlp_models.morph.parse(request.lemma)[0]
        inflected = parsed.inflect(pymorphy_tags)

        if not inflected:
            raise ValueError(f"Can't inflect {request.lemma} with {features}")

        return InflectResponse(
            lemma=request.lemma,
            inflected=inflected.word,
            requested_features=features,
            normal_form=parsed.normal_form,
            tag=str(parsed.tag),
            success=True
        )
    except Exception as e:
        logger