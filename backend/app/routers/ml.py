from fastapi import APIRouter
from pydantic import BaseModel
from app.services.ml_client import enhance_text

router = APIRouter(prefix="/ml", tags=["ML Module"])

class TextIn(BaseModel):
    text: str

@router.post("/process")
async def process_text(data: TextIn):
    result = await enhance_text(data.text)
    return {"result": result}
