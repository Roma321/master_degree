from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_TITLE: str = "NLP Microservice API"
    APP_DESCRIPTION: str = "API для лингвистической обработки текста на русском языке"
    APP_VERSION: str = "1.0.0"

    STANZA_MODELS: dict = {
        'pos': ['tokenize', 'pos'],
        'ner': ['tokenize', 'ner'],
        'depparse': ['tokenize', 'pos', 'lemma', 'depparse'],
        'lemma': ['tokenize', 'pos', 'lemma']
    }

    TAG_MAPPING: dict = {
        'Nom': 'nomn',
        'Gen': 'gent',
        'Dat': 'datv',
        'Acc': 'accs',
        'Ins': 'ablt',
        'Loc': 'loct',
        'Sing': 'sing',
        'Plur': 'plur',
        'Masc': 'masc',
        'Fem': 'femn',
        'Neut': 'neut',
        'Past': 'past',
        'Pres': 'pres',
        'Fut': 'futr',
        '1': '1per',
        '2': '2per',
        '3': '3per',
        'Act': 'actv',
        'Pass': 'pssv',
    }

    OPENAPI_TAGS: list = [
        {
            "name": "Text Processing",
            "description": "Основные операции обработки текста"
        },
        {
            "name": "Morphology",
            "description": "Морфологический анализ и генерация слов"
        },
        {
            "name": "Service",
            "description": "Сервисные endpoints"
        }
    ]


settings = Settings()