from pydantic import BaseModel


class CorpusItem(BaseModel):
    text: str
    label: str