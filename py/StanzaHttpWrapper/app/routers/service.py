from fastapi import APIRouter
from app.dependencies import nlp_models

router = APIRouter(prefix="/api/v1/service", tags=["Service"])

@router.get("/health")
async def health_check():
    """Проверка состояния сервиса"""
    return {
        "status": "ok",
        "loaded_models": list(nlp_models._pipelines.keys())
    }