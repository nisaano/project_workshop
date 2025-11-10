import asyncio
import sys
import os
from typing import Dict, Any
import re
from collections import Counter

# Добавляем путь к ML модулю
sys.path.append(os.path.join(os.path.dirname(__file__), '../../..', 'ml_module'))

try:
    from text_enhancer import AdvancedTextEnhancer
except ImportError:
    # Fallback если ML модуль недоступен
    class AdvancedTextEnhancer:
        def process_text(self, text):
            return {
                "processed_text": text,
                "key_terms": [],
                "stats": {"word_count": len(text.split())}
            }

class MLEnhancerService:
    """Сервис для интеграции ML модуля"""
    
    def __init__(self):
        self.enhancer = AdvancedTextEnhancer()
    
    async def process_text(self, text: str, enhance_type: str = "enhance") -> Dict[str, Any]:
        """Обработка текста ML модулем"""
        try:
            if not text or not text.strip():
                return {
                    "processed_text": "",
                    "key_terms": [],
                    "stats": {},
                    "error": "Пустой текст"
                }
            
            # Используем ML модуль для обработки
            result = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.enhancer.process_text(text)
            )
            
            # Адаптируем результат под нашу структуру
            if isinstance(result, dict):
                return {
                    "processed_text": result.get("processed_text", text),
                    "key_terms": result.get("key_terms", []),
                    "stats": result.get("stats", {})
                }
            else:
                return {
                    "processed_text": result,
                    "key_terms": [],
                    "stats": {"word_count": len(text.split())}
                }
                
        except Exception as e:
            return {
                "processed_text": text,
                "key_terms": [],
                "stats": {},
                "error": f"ML обработка ошибка: {str(e)}"
            }
