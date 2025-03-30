from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.models import TextRequest
from app.dependencies import nlp_models
from app.utils.nlp import process_stanza_pipeline
import logging

router = APIRouter(prefix="/api/v1/text", tags=["Text Processing"])
logger = logging.getLogger(__name__)

@router.post("/pos")
async def process_pos(request: TextRequest):
    """POS-тэгинг текста"""
    logger.info(f"Processing POS for text length: {len(request.text)}")
    return {"result": process_stanza_pipeline('pos', request.text, nlp_models)}

@router.post("/ner")
async def process_ner(request: TextRequest):
    """Распознавание именованных сущностей"""
    return {"result": process_stanza_pipeline('ner', request.text, nlp_models)}

@router.post("/depparse")
async def process_depparse(request: TextRequest):
    """Анализ синтаксических зависимостей"""
    return {"result": process_stanza_pipeline('depparse', request.text, nlp_models)}

@router.post("/sentence-split")
async def sentence_split(request: TextRequest):
    """Разбивка текста на предложения"""
    if not request.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Текст не может быть пустым"
        )
    from razdel import sentenize
    sentences = [s.text for s in sentenize(request.text)]
    return {"sentences": sentences}