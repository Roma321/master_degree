from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import stanza
from typing import List, Optional
import logging
from razdel import sentenize
# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Stanza NLP Microservice")

# Загружаем модели при старте сервиса (можно вынести в отдельную функцию)
try:
    # Основные пайплайны
    nlp_pos = stanza.Pipeline(lang='ru', processors='tokenize,pos')
    nlp_ner = stanza.Pipeline(lang='ru', processors='tokenize,ner')
    nlp_depparse = stanza.Pipeline(lang='ru', processors='tokenize,pos,lemma,depparse')
    # nlp_sent_split = stanza.Pipeline(lang='ru', processors='tokenize')

    logger.info("Stanza models loaded successfully")
except Exception as e:
    logger.error(f"Failed to load Stanza models: {str(e)}")
    raise


class TextRequest(BaseModel):
    text: str
    processors: Optional[List[str]] = None


@app.post("/process/pos")
async def process_pos(request: TextRequest):
    """Обработка текста с POS-тэгингом"""
    try:
        doc = nlp_pos(request.text)
        return {"result": doc.to_dict()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/process/ner")
async def process_ner(request: TextRequest):
    """Обработка текста с распознаванием именованных сущностей"""
    try:
        doc = nlp_ner(request.text)
        return {"result": doc.to_dict()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/process/depparse")
async def process_depparse(request: TextRequest):
    """Обработка текста с анализом зависимостей"""
    try:
        doc = nlp_depparse(request.text)
        return {"result": doc.to_dict()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    """Проверка работоспособности сервиса"""
    return {"status": "ok"}

@app.post("/process/sentence-split")
async def sentence_split(request: TextRequest):
    """Разбивка текста на предложения"""
    sentences = [s.text for s in sentenize(request.text)]
    return {"sentences": sentences}

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)