from fastapi import FastAPI
from fastapi.responses import JSONResponse
from app.routers import text, morphology, service
from app.config import settings
from app.dependencies import nlp_models
import logging

logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.APP_TITLE,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    openapi_tags=settings.OPENAPI_TAGS
)

# Подключение роутеров
app.include_router(text.router)
app.include_router(morphology.router)
app.include_router(service.router)

@app.on_event("startup")
async def startup_event():
    """Предзагрузка основных моделей при старте"""
    try:
        nlp_models.get_pipeline('pos')
        nlp_models.get_pipeline('ner')
        logger.info("Preloaded models: pos, ner")
    except Exception as e:
        logger.error(f"Startup error: {str(e)}")

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Глобальный обработчик исключений"""
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Внутренняя ошибка сервера"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)