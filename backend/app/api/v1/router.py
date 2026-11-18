from fastapi import APIRouter
from app.api.v1.projects import router as projects_router
from app.api.v1.sources import router as sources_router

api_v1_router = APIRouter()
api_v1_router.include_router(projects_router)
api_v1_router.include_router(sources_router)
