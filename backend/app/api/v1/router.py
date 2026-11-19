from fastapi import APIRouter
from app.api.v1.projects import router as projects_router
from app.api.v1.sources import router as sources_router
from app.api.v1.zoho import router as zoho_router
from app.api.v1.mappings import router as mappings_router
from app.api.v1.transformations import router as transformations_router
from app.api.v1.validations import router as validations_router
from app.api.v1.dependencies import router as dependencies_router
from app.api.v1.exports import router as exports_router
from app.api.v1.migrations import router as migrations_router
from app.api.v1.audit import router as audit_router

api_v1_router = APIRouter()
api_v1_router.include_router(projects_router)
api_v1_router.include_router(sources_router)
api_v1_router.include_router(zoho_router)
api_v1_router.include_router(mappings_router)
api_v1_router.include_router(transformations_router)
api_v1_router.include_router(validations_router)
api_v1_router.include_router(dependencies_router)
api_v1_router.include_router(exports_router)
api_v1_router.include_router(migrations_router)
api_v1_router.include_router(audit_router)
