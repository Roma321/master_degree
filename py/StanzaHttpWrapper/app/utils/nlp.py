import stanza
import pymorphy2
from typing import Dict, Optional
import logging

from fastapi import HTTPException
from gensim.models import KeyedVectors
from starlette import status
import gensim.downloader as api
logger = logging.getLogger(__name__)


class NLPModels:
    def __init__(self, config):
        self._pipelines: Dict[str, stanza.Pipeline] = {}
        self.morph = pymorphy2.MorphAnalyzer()
        self.word2Vec =  KeyedVectors.load_word2vec_format('/home/roman/projects/mag/py/StanzaHttpWrapper/models/model_w2v.bin', binary=True)
        self.config = config

    def get_pipeline(self, name: str) -> Optional[stanza.Pipeline]:
        try:
            if name not in self._pipelines:
                processors = self.config.STANZA_MODELS.get(name)
                if not processors:
                    raise ValueError(f"Unknown pipeline: {name}")

                self._pipelines[name] = stanza.Pipeline(
                    lang='ru',
                    processors=','.join(processors),
                    logging_level='WARN'
                )
            return self._pipelines[name]
        except Exception as e:
            logger.error(f"Pipeline {name} init error: {str(e)}")
            raise


def process_stanza_pipeline(
        pipeline_name: str,
        text: str,
        models: NLPModels
):
    try:
        pipeline = models.get_pipeline(pipeline_name)
        doc = pipeline(text)
        return doc.to_dict()
    except Exception as e:
        logger.error(f"Stanza processing error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ошибка обработки текста"
        )