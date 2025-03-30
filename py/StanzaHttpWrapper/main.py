from typing import List, Optional
from razdel import sentenize

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import stanza
import pymorphy2
from typing import Dict, List
import logging
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
    nlp_lemma = stanza.Pipeline(lang='ru', processors='tokenize,pos,lemma')
    morph = pymorphy2.MorphAnalyzer()
    logger.info("Stanza models loaded successfully")
except Exception as e:
    logger.error(f"Failed to load Stanza models: {str(e)}")
    raise


class TextRequest(BaseModel):
    text: str
    processors: Optional[List[str]] = None

class LemmaRequest(BaseModel):
    word: str


class MorphRequest(BaseModel):
    word: str

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

@app.post("/process/lemma")
async def get_lemma(request: LemmaRequest):
    """Возвращает лемму слова"""
    try:
        doc = nlp_lemma(request.word)
        if len(doc.sentences) > 0 and len(doc.sentences[0].words) > 0:
            lemma = doc.sentences[0].words[0].lemma
            return {"lemma": lemma}
        return {"lemma": request.word}  # fallback
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/process/morph-features")
async def get_morph_features(request: MorphRequest):
    """Возвращает грамматические характеристики слова"""
    try:
        doc = nlp_lemma(request.word)
        if len(doc.sentences) > 0 and len(doc.sentences[0].words) > 0:
            word = doc.sentences[0].words[0]
            features = word.feats.split('|') if word.feats else []
            features_dict = {}
            for feature in features:
                if '=' in feature:
                    key, value = feature.split('=')
                    features_dict[key] = value
            return {
                "word": request.word,
                "features": features_dict
            }
        return {"word": request.word, "features": {}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class InflectRequest(BaseModel):
    lemma: str
    features: Optional[Dict[str, str]] = None
    features_str: Optional[str] = None

@app.post("/process/inflect-word")
async def inflect_word(request: InflectRequest):
    print("ENTER HERE")
    print(request)
    """Склоняет/спрягает слово по заданным грамматическим характеристикам.

    Принимает характеристики в двух форматах:
    1. Словарь: {"Case": "Nom", "Number": "Sing"}
    2. Строка в формате Stanza: "Case=Nom|Number=Sing"

    Поддерживаемые характеристики (аналогично Stanza):
    - Case: Nom, Gen, Dat, Acc, Ins, Loc
    - Number: Sing, Plur
    - Gender: Masc, Fem, Neut
    - Tense: Past, Pres, Fut
    - Person: 1, 2, 3
    - и другие (см. документацию Stanza/UDPipe)
    """
    try:
        parsed = morph.parse(request.lemma)[0]

        # Преобразуем характеристики в формат pymorphy2
        features = {}

        # Если характеристики переданы строкой (формат Stanza)
        if request.features_str:
            for feature in request.features_str.split('|'):
                if '=' in feature:
                    key, value = feature.split('=')
                    features[key] = value
        # Или если переданы словарём
        else:
            features = request.features
        print(request)
        # Маппинг между тегами Stanza и pymorphy2
        tag_mapping = {
            # Падежи
            'Nom': 'nomn',
            'Gen': 'gent',
            'Dat': 'datv',
            'Acc': 'accs',
            'Ins': 'ablt',
            'Loc': 'loct',
            # Число
            'Sing': 'sing',
            'Plur': 'plur',
            # Род
            'Masc': 'masc',
            'Fem': 'femn',
            'Neut': 'neut',
            # Время (для глаголов)
            'Past': 'past',
            'Pres': 'pres',
            'Fut': 'futr',
            # Лицо
            '1': '1per',
            '2': '2per',
            '3': '3per',
        }

        # Преобразуем теги в формат pymorphy2
        pymorphy_tags = set()

        for stanza_tag, value in features.items():
            if stanza_tag in ['Case', 'Number', 'Gender', 'Tense', 'Person']:
                mapped_value = tag_mapping.get(value)
                if mapped_value:
                    pymorphy_tags.add(mapped_value)

        # Пытаемся просклонять слово
        inflected = parsed.inflect(pymorphy_tags)

        if not inflected:
            raise ValueError(f"Cannot inflect word '{request.lemma}' with features {features}")

        return {
            "lemma": request.lemma,
            "inflected": inflected.word,
            "requested_features": features,
            "normal_form": parsed.normal_form,
            "tag": str(parsed.tag),
            "success": True
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail={
                "error": str(e),
                "message": "Ошибка при склонении слова. Убедитесь, что слово существует и запрошенные характеристики совместимы.",
                "success": False
            }
        )

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)