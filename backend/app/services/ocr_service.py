import base64
import asyncio
from app.core.config import settings
from app.services.openrouter_service import OpenRouterService
from typing import Dict, Any

class OCRService:
    """OCR сервис через OpenRouter Vision модели"""
    
    def __init__(self):
        self.openrouter = OpenRouterService()
    
    async def process_image(self, image_data: str) -> Dict[str, Any]:
        """Обработка изображения через OpenRouter"""
        try:
            # Промпт для OCR
            ocr_prompt = "Точно распознай весь текст на этом изображении. Верни только распознанный текст без форматирования и комментариев."
            
            extracted_text = await self.openrouter.process_image_with_text(image_data, ocr_prompt)
            
            return {
                "text": extracted_text,
                "confidence": 0.95,
                "word_count": len(extracted_text.split()),
                "language": "ru",
                "model_used": settings.OPENROUTER_OCR_MODEL
            }
            
        except Exception as e:
            return {
                "text": "",
                "confidence": 0.0,
                "error": f"OCR ошибка: {str(e)}",
                "word_count": 0
            }
    
    async def process_image_with_enhancement(self, image_data: str, enhancement_type: str) -> Dict[str, Any]:
        """Прямая обработка изображения с улучшением"""
        try:
            enhancement_prompts = {
                "summarize": "Распознай текст на этом изображении и создай краткое содержание, выделяя ключевые идеи:",
                "enhance": "Распознай текст и улучши его структуру, сделав более читаемым и организованным:",
                "extract_terms": "Распознай текст и выдели ключевые термины и понятия:"
            }
            
            prompt = enhancement_prompts.get(enhancement_type, "Распознай текст на изображении:")
            processed_text = await self.openrouter.process_image_with_text(image_data, prompt)
            
            return {
                "text": processed_text,
                "confidence": 0.95,
                "word_count": len(processed_text.split()),
                "enhancement_type": enhancement_type
            }
            
        except Exception as e:
            return {
                "text": "",
                "confidence": 0.0,
                "error": f"Ошибка улучшения изображения: {str(e)}"
            }
