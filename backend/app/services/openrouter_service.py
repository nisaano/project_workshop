import openai
import asyncio
from app.core.config import settings
from typing import AsyncGenerator

class OpenRouterService:
    def __init__(self):
        self.client = openai.OpenAI(
            api_key=settings.OPENROUTER_API_KEY,
            base_url="https://openrouter.ai/api/v1"
        )
        self.model = settings.OPENROUTER_MODEL
    
    async def process_text(self, text: str, processing_type: str) -> str:
        """Обработка текста через OpenRouter"""
        try:
            # Промпты для разных типов обработки
            prompts = {
                "summarize": f"Сократи следующий учебный конспект, сохраняя ключевые идеи и факты. Верни только сокращенный текст без комментариев:\n\n{text}",
                "enhance": f"Улучши структуру и читаемость этого учебного конспекта. Сделай его более организованным и понятным:\n\n{text}",
                "extract_terms": f"Выдели ключевые термины и понятия из этого учебного конспекта:\n\n{text}"
            }
            
            prompt = prompts.get(processing_type, text)
            
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {
                            "role": "system", 
                            "content": "Ты - помощник для обработки учебных конспектов. Возвращай только обработанный текст без дополнительных комментариев."
                        },
                        {
                            "role": "user", 
                            "content": prompt
                        }
                    ],
                    max_tokens=4000,
                    temperature=0.3
                )
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            return f"Ошибка OpenRouter: {str(e)}"
    
    async def process_image_with_text(self, image_data: str, text_prompt: str) -> str:
        """Обработка изображения через OpenRouter Vision"""
        try:
            # Извлекаем base64 данные если нужно
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.client.chat.completions.create(
                    model=settings.OPENROUTER_OCR_MODEL,
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": text_prompt},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{image_data}"
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens=2000
                )
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            return f"Ошибка обработки изображения: {str(e)}"
