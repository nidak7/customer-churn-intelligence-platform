from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routes.churn_routes import router as churn_router
from app.services.churn_service import ChurnService
from app.utils.exceptions import (
    DatasetNotLoadedError,
    DatasetValidationError,
    ModelNotTrainedError,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    service = ChurnService()
    service.bootstrap_sample_dataset()
    app.state.churn_service = service
    yield


app = FastAPI(
    title="Customer Churn API",
    version="1.0.0",
    description="Churn analysis and prediction API for the Telco customer dataset.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

app.include_router(churn_router)


@app.get("/")
def root():
    return {
        "message": "Customer Churn API is running.",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok", "service": "customer-churn-intelligence-api"}


@app.exception_handler(DatasetValidationError)
async def dataset_validation_error_handler(_, exc: DatasetValidationError):
    return JSONResponse(status_code=400, content={"detail": exc.message})


@app.exception_handler(DatasetNotLoadedError)
async def dataset_not_loaded_error_handler(_, exc: DatasetNotLoadedError):
    return JSONResponse(status_code=404, content={"detail": exc.message})


@app.exception_handler(ModelNotTrainedError)
async def model_not_trained_error_handler(_, exc: ModelNotTrainedError):
    return JSONResponse(status_code=400, content={"detail": exc.message})
