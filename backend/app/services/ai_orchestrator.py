import asyncio
from typing import Dict, Any
from app.core.config import settings
from app.services.openrouter_service import OpenRouterService
from app.services.ocr_service import OCRService
from app.services.ml_enhancer_service import MLEnhancerService

class AIOrchestrator:
    """Оркестратор для координации всех AI сервисов"""
    
    def __init__(self):
        self.openrouter = OpenRouterService()
        self.ocr = OCRService()
        self.ml_enhancer = MLEnhancerService()
    
    async def process_request(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Основной метод обработки запроса"""
        start_time = asyncio.get_event_loop().time()
        
        try:
            result = {
                "success": False,
                "processing_time": 0,
                "steps": {}
            }
            
            # Определяем тип контента
            content_type = request_data["type"]  # 'text' or 'image'
            processing_type = request_data["processing_type"]  # 'summarize', 'enhance', etc.
            content = request_data["content"]
            
            # Шаг 1: Обработка изображения если нужно
            if content_type == "image":
                if settings.USE_DIRECT_OCR_ENHANCEMENT:
                    ocr_result = await self.ocr.process_image_with_enhancement(content, processing_type)
                else:
                    ocr_result = await self.ocr.process_image(content)
                
                result["steps"]["ocr"] = ocr_result
                
                if not ocr_result.get("text"):
                    result["error"] = "Не удалось распознать текст с изображения"
                    return result
                
                text_to_process = ocr_result["text"]
            else:
                text_to_process = content
            
            # Шаг 2: Обработка через OpenRouter
            if settings.USE_OPENROUTER and (content_type != "image" or not settings.USE_DIRECT_OCR_ENHANCEMENT):
                openrouter_result = await self.openrouter.process_text(text_to_process, processing_type)
                result["steps"]["openrouter"] = openrouter_result
                text_for_ml = openrouter_result
            else:
                text_for_ml = text_to_process
            
            # Шаг 3: ML улучшение
            if settings.USE_ML_ENHANCER:
                ml_result = await self.ml_enhancer.process_text(text_for_ml, processing_type)
                result["steps"]["ml_enhancement"] = ml_result
                final_text = ml_result["processed_text"]
                key_terms = ml_result.get("key_terms", [])
            else:
                final_text = text_for_ml
                key_terms = []
            
            # Финальный результат
            result["success"] = True
            result["final_text"] = final_text
            result["key_terms"] = key_terms
            
            # Добавляем статистику
            if content_type == "image":
                result["ocr_confidence"] = result["steps"]["ocr"].get("confidence", 0)
            
        except Exception as e:
            result["error"] = f"Ошибка оркестрации: {str(e)}"
        
        finally:
            result["processing_time"] = asyncio.get_event_loop().time() - start_time
        
        return result
