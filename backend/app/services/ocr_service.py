import base64
import openai
import asyncio
from app.core.config import settings
from typing import Dict, Any

class OCRService:
    """OCR сервис через OpenRouter с использованием мультимодальных моделей"""
    
    def __init__(self):
        self.client = openai.OpenAI(
            api_key=settings.OPENROUTER_API_KEY,
            base_url="https://openrouter.ai/api/v1"
        )
        self.model = settings.OPENROUTER_OCR_MODEL
    
    async def process_image(self, image_data: str) -> Dict[str, Any]:
        """Обработка изображения через OpenRouter Vision модель"""
        try:
            # Извлекаем base64 данные если это data URL
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            # Создаем промпт для OCR
            system_prompt = """Ты - экспертная система OCR для учебных материалов. 
            Твоя задача - точно распознать весь текст с изображения и вернуть его в чистом виде.
            
            Требования:
            1. Сохрани всю структуру текста (абзацы, списки, заголовки)
            2. Не добавляй комментарии и пояснения
            3. Сохрани математические формулы и специальные символы
            4. Если текст на русском - сохрани кириллицу
            5. Верни только распознанный текст, без обрамления"""
            
            # Выполняем запрос к OpenRouter
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {
                            "role": "system", 
                            "content": system_prompt
                        },
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text", 
                                    "text": "Распознай текст на этом изображении и верни его в чистом виде:"
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{image_data}"
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens=4000,
                    temperature=0.1
                )
            )
            
            extracted_text = response.choices[0].message.content.strip()
            
            return {
                "text": extracted_text,
                "confidence": 0.95,  # OpenRouter не возвращает confidence, используем высокое значение
                "word_count": len(extracted_text.split()),
                "language": "ru",
                "model_used": self.model
            }
            
        except Exception as e:
            return {
                "text": "",
                "confidence": 0.0,
                "error": f"OpenRouter OCR ошибка: {str(e)}",
                "word_count": 0,
                "language": "unknown"
            }
    
    async def process_image_with_enhancement(self, image_data: str, enhancement_type: str = "summarize") -> Dict[str, Any]:
        """Обработка изображения с одновременным улучшением текста"""
        try:
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            # Промпты для разных типов улучшения
            enhancement_prompts = {
                "summarize": "Распознай текст на изображении и создай краткое содержание, выделяя ключевые идеи:",
                "enhance": "Распознай текст и улучши его структуру, сделав более читаемым и организованным:",
                "extract_terms": "Распознай текст и выдели ключевые термины и понятия:"
            }
            
            prompt = enhancement_prompts.get(enhancement_type, "Распознай текст на изображении:")
            
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{image_data}"
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens=4000
                )
            )
            
            processed_text = response.choices[0].message.content.strip()
            
            return {
                "text": processed_text,
                "confidence": 0.95,
                "word_count": len(processed_text.split()),
                "language": "ru",
                "enhancement_type": enhancement_type,
                "model_used": self.model
            }
            
        except Exception as e:
            return {
                "text": "",
                "confidence": 0.0,
                "error": f"OpenRouter OCR+Enhancement ошибка: {str(e)}"
            }
