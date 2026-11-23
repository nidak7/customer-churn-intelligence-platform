from fastapi import APIRouter, File, Query, Request, UploadFile
from fastapi.responses import StreamingResponse

from app.models.schemas import PredictionRequest

router = APIRouter()


def get_service(request: Request):
    return request.app.state.churn_service


def build_filters(
    contract: str | None,
    internet_service: str | None,
    payment_method: str | None,
    churn: str | None,
):
    return {
        "Contract": contract,
        "InternetService": internet_service,
        "PaymentMethod": payment_method,
        "Churn": churn,
    }


@router.post("/upload")
async def upload_dataset(request: Request, file: UploadFile = File(...)):
    service = get_service(request)
    payload = await file.read()
    return service.ingest_uploaded_file(file.filename or "uploaded.csv", payload)


@router.get("/summary")
def get_summary(
    request: Request,
    contract: str | None = Query(default=None),
    internet_service: str | None = Query(default=None),
    payment_method: str | None = Query(default=None),
    churn: str | None = Query(default=None),
):
    service = get_service(request)
    filters = build_filters(contract, internet_service, payment_method, churn)
    return service.get_summary(filters)


@router.get("/charts")
def get_charts(
    request: Request,
    contract: str | None = Query(default=None),
    internet_service: str | None = Query(default=None),
    payment_method: str | None = Query(default=None),
    churn: str | None = Query(default=None),
):
    service = get_service(request)
    filters = build_filters(contract, internet_service, payment_method, churn)
    return service.get_chart_payload(filters)


@router.get("/insights")
def get_insights(
    request: Request,
    contract: str | None = Query(default=None),
    internet_service: str | None = Query(default=None),
    payment_method: str | None = Query(default=None),
    churn: str | None = Query(default=None),
):
    service = get_service(request)
    filters = build_filters(contract, internet_service, payment_method, churn)
    return service.get_insight_payload(filters)


@router.post("/train-model")
def train_model(request: Request):
    service = get_service(request)
    return service.train_model()


@router.post("/predict")
def predict_customer_risk(request: Request, payload: PredictionRequest):
    service = get_service(request)
    return service.predict_customer(payload.model_dump())


@router.get("/export-report")
def export_report(request: Request, format: str = Query(default="csv")):
    service = get_service(request)
    filename, media_type, file_bytes = service.export_report(format)
    return StreamingResponse(
        iter([file_bytes]),
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
