from typing import List, Dict, Optional
from pydantic import BaseModel, Field

class TextRequest(BaseModel):
    text: str = Field(..., min_length=1, example="Привет, мир!", description="Текст для обработки")
    processors: Optional[List[str]] = Field(
        None,
        example=["pos", "lemma"],
        description="Список процессоров (опционально)"
    )

class LemmaRequest(BaseModel):
    word: str = Field(..., min_length=1, example="кошкам", description="Слово для лемматизации")

class MorphFeaturesResponse(BaseModel):
    word: str
    pos: Optional[str]
    features: Dict[str, str]

class InflectRequest(BaseModel):
    lemma: str = Field(..., min_length=1, example="кошка")
    features: Optional[Dict[str, str]] = Field(
        None,
        example={"Case": "Dat", "Number": "Plur"},
        description="Граммемы в формате ключ-значение"
    )
    features_str: Optional[str] = Field(
        None,
        example="Case=Dat|Number=Plur",
        description="Граммемы в строковом формате"
    )

class InflectResponse(BaseModel):
    lemma: str
    inflected: str
    requested_features: Dict[str, str]
    normal_form: str
    tag: str
    success: bool

class CompareRequest(BaseModel):
    word1: str
    word2: str