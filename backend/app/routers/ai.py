from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.db.models.user import User
from app.services.ai_orchestrator import AIOrchestrator
import base64
import uuid

router = APIRouter(prefix="/ai", tags=["ai"])

@router.post("/process-text")
async def process_text(
    text: str = Form(...),
    processing_type: str = Form(default="enhance"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Обработка текстового запроса"""
    try:
        if not text.strip():
            raise HTTPException(status_code=400, detail="Текст не может быть пустым")
            
        orchestrator = AIOrchestrator()
        result = await orchestrator.process_request({
            "type": "text",
            "content": text,
            "processing_type": processing_type
        })
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result.get("error", "Unknown error"))
        
        return {
            "processed_text": result["final_text"],
            "key_terms": result.get("key_terms", []),
            "processing_time": result["processing_time"],
            "success": True
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process-image")
async def process_image(
    file: UploadFile = File(...),
    processing_type: str = Form(default="enhance"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Обработка изображения"""
    try:
        # Проверка типа файла
        allowed_mime_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if file.content_type not in allowed_mime_types:
            raise HTTPException(status_code=400, detail="Неподдерживаемый формат изображения. Используйте JPEG, PNG, GIF или WebP.")
        
        # Проверка размера файла (макс 10MB)
        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Файл слишком большой. Максимальный размер: 10MB")
        
        # Кодирование в base64
        encoded_string = base64.b64encode(contents).decode('utf-8')
        
        orchestrator = AIOrchestrator()
        result = await orchestrator.process_request({
            "type": "image",
            "content": f"data:{file.content_type};base64,{encoded_string}",
            "processing_type": processing_type,
            "filename": file.filename
        })
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result.get("error", "Unknown error"))
        
        return {
            "original_text": result["steps"].get("ocr", {}).get("text", ""),
            "processed_text": result["final_text"],
            "key_terms": result.get("key_terms", []),
            "ocr_confidence": result.get("ocr_confidence", 0),
            "processing_time": result["processing_time"],
            "success": True
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
