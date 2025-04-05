from typing import Dict, List

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

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
    """Анализ морфологических признаков и части речи"""
    try:
        doc = nlp_models.get_pipeline('lemma')(request.word)
        pos = None
        features = {}

        if doc.sentences and doc.sentences[0].words:
            word_data = doc.sentences[0].words[0]
            pos = word_data.upos  # Universal POS-тег (например, "NOUN", "VERB")

            # Парсим морфологические признаки
            if word_data.feats:
                for feat in word_data.feats.split('|'):
                    if '=' in feat:
                        key, val = feat.split('=', 1)
                        features[key] = val

        return MorphFeaturesResponse(word=request.word, pos=pos, features=features)

    except Exception as e:
        logger.error(f"Features error: {str(e)}")
        return MorphFeaturesResponse(word=request.word, pos=None, features={})


@router.post("/inflect", response_model=InflectResponse)
async def inflect_word(request: InflectRequest):
    """Генерация словоформы"""
    try:
        features = parse_features(request.features, request.features_str)
        pymorphy_tags = map_tags_to_pymorphy(features)
        print(pymorphy_tags)
        parsed = nlp_models.morph.parse(request.lemma)[0]
        print(parsed)
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
        logger.error(e)

class SentenceRequest(BaseModel):
    sentence: str  # Предложение для анализа

class WordMorphFeatures(BaseModel):
    word: str
    pos: str  # Часть речи (POS-тег)
    features: dict  # Морфологические признаки

class SentenceMorphFeaturesResponse(BaseModel):
    sentence: str
    words: List[WordMorphFeatures]  # Список слов с их морфологическими признаками

@router.post("/sentence_features", response_model=SentenceMorphFeaturesResponse)
async def get_sentence_morph_features(request: SentenceRequest):
    """
    Анализ морфологических признаков и частей речи для каждого слова в предложении.
    """
    try:
        # Обработка предложения через NLP-пайплайн
        doc = nlp_models.get_pipeline('lemma')(request.sentence)
        words_data = []

        # Проходим по всем словам в предложении
        for sentence in doc.sentences:
            for word_data in sentence.words:
                pos = word_data.upos  # Universal POS-тег (например, "NOUN", "VERB")
                features = {}

                # Парсим морфологические признаки
                if word_data.feats:
                    for feat in word_data.feats.split('|'):
                        if '=' in feat:
                            key, val = feat.split('=', 1)
                            features[key] = val

                # Добавляем данные о слове в список
                words_data.append(
                    WordMorphFeatures(word=word_data.text, pos=pos, features=features)
                )

        # Возвращаем результат
        return SentenceMorphFeaturesResponse(sentence=request.sentence, words=words_data)

    except Exception as e:
        # Логирование ошибки
        logger.error(f"Sentence features error: {str(e)}")
        return SentenceMorphFeaturesResponse(sentence=request.sentence, words=[])