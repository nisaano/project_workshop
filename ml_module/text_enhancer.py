import re
from collections import Counter
from typing import List

class TextEnhancer:
    def __init__(self):
        # Расширенный список стоп-слов (включая глаголы и обычные слова)
        self.stop_words = {
            # Русские стоп-слова
            'и', 'в', 'во', 'на', 'с', 'по', 'к', 'у', 'о', 'из', 'за', 'от', 'до', 
            'не', 'что', 'как', 'а', 'то', 'все', 'так', 'это', 'но', 'они', 'мы', 
            'вы', 'его', 'ее', 'их', 'этот', 'тот', 'который', 'которые', 'этом', 
            'вот', 'или', 'если', 'при', 'также', 'для', 'со', 'то', 'же', 'бы', 
            'ли', 'по', 'до', 'нет', 'да', 'ну', 'вы', 'мне', 'меня', 'тебе', 'тебя',
            'ему', 'ей', 'нам', 'вам', 'ими', 'ними', 'описывает', 'является',
            'говорит', 'был', 'была', 'имеет', 'могут', 'может', 'этом', 'какой',
            'когда', 'где', 'чем', 'почему', 'хотя', 'после', 'перед', 'между',
            
            # Английские стоп-слова
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
            'of', 'with', 'by', 'as', 'is', 'are', 'was', 'were', 'be', 'been', 
            'this', 'that', 'these', 'those', 'have', 'has', 'had', 'do', 'does',
            'did', 'will', 'would', 'could', 'should', 'can', 'may', 'might'
        }
        
        # Регулярные выражения для дат
        self.date_patterns = [
            r'\b\d{1,2}\.\d{1,2}\.\d{4}\b',  # DD.MM.YYYY
            r'\b\d{1,2}/\d{1,2}/\d{4}\b',     # DD/MM/YYYY
            r'\b\d{4}\b',                      # YYYY
        ]
    
    def remove_repetitive_phrases(self, text: str) -> str:
        """Удаляет повторяющиеся фразы в тексте"""
        # Разбиваем на предложения
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        # Удаляем дубликаты (более строгий подход)
        seen = set()
        unique_sentences = []
        
        for sentence in sentences:
            # Нормализуем предложение для сравнения
            normalized = re.sub(r'\s+', ' ', sentence.lower().strip())
            words = normalized.split()
            
            # Проверяем, не является ли предложение слишком коротким
            if len(words) < 4:
                unique_sentences.append(sentence)
                continue
                
            # Создаем ключ для сравнения (первые 5 слов)
            key = ' '.join(words[:5])
            
            if key not in seen:
                seen.add(key)
                unique_sentences.append(sentence)
        
        # Собираем обратно с точками
        return '. '.join(unique_sentences) + '.' if unique_sentences else ''
    
    def improve_paragraph_structure(self, text: str) -> str:
        """Улучшает структуру абзацев"""
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 10]
        
        if not sentences:
            return text
            
        # Группируем в абзацы по 2 предложения
        paragraphs = []
        for i in range(0, len(sentences), 2):
            if i + 1 < len(sentences):
                paragraph = sentences[i] + '. ' + sentences[i+1] + '.'
            else:
                paragraph = sentences[i] + '.'
            paragraphs.append(paragraph)
        
        return '\n\n'.join(paragraphs)
    
    def extract_key_terms(self, text: str, top_n: int = 5) -> List[str]:
        """Извлекает только настоящие ключевые термины"""
        # Убираем уже выделенные термины
        clean_text = re.sub(r'\*\*.*?\*\*', '', text)
        
        # Находим слова (только кириллические от 5 символов)
        words = re.findall(r'\b[а-я]{5,}\b', clean_text.lower())
        
        # Фильтруем стоп-слова и слишком общие слова
        filtered_words = [
            word for word in words 
            if (word not in self.stop_words and 
                not word.endswith('ет') and  # исключаем глаголы
                not word.endswith('ит') and
                not word.endswith('ат') and
                not word.endswith('ут') and
                not word.endswith('ют') and
                not word.endswith('лся') and
                not word.endswith('лась') and
                not word.endswith('лось') and
                not word.endswith('лись'))
        ]
        
        # Считаем частотность
        word_freq = Counter(filtered_words)
        
        # Берем только термины, которые встречаются минимум 2 раза
        key_terms = [word for word, count in word_freq.most_common(top_n * 3) if count >= 2]
        
        return key_terms[:top_n]
    
    def highlight_key_elements(self, text: str) -> str:
        """Выделяет ключевые термины и даты в тексте"""
        enhanced_text = text
        
        # Сначала выделяем даты
        for pattern in self.date_patterns:
            dates = re.findall(pattern, enhanced_text)
            for date in set(dates):
                enhanced_text = enhanced_text.replace(date, f'**{date}**')
        
        # Затем выделяем ключевые термины
        key_terms = self.extract_key_terms(enhanced_text)
        print(f"Выделяемые термины: {key_terms}")  # Для отладки
        
        # Выделяем только полные совпадения терминов
        for term in key_terms:
            # Используем границы слов и проверяем, что это не часть уже выделенного
            pattern = r'(?<!\*)\b' + re.escape(term) + r'\b(?!\*)'
            enhanced_text = re.sub(pattern, f'**{term}**', enhanced_text, flags=re.IGNORECASE)
        
        return enhanced_text
    
    def process_text(self, text: str) -> str:
        """Основная функция обработки текста"""
        print("Начальная обработка текста...")
        
        # 1. Удаляем повторяющиеся фразы
        text_no_repeats = self.remove_repetitive_phrases(text)
        print("✓ Удалены повторяющиеся фразы")
        
        # 2. Улучшаем структуру абзацев
        structured_text = self.improve_paragraph_structure(text_no_repeats)
        print("✓ Улучшена структура абзацев")
        
        # 3. Выделяем ключевые элементы
        final_text = self.highlight_key_elements(structured_text)
        print("✓ Выделены ключевые термины и даты")
        
        return final_text

def enhance_text(text: str) -> str:
    enhancer = TextEnhancer()
    return enhancer.process_text(text)

# Тестируем
if __name__ == "__main__":
    sample_text = """
    Квантовая механика описывает поведение частиц. Квантовая механика важна для физики. 
    Волновая функция является ключевым понятием. Волновая функция описывает состояние системы.
    Принцип неопределенности Гейзенберга был сформулирован в 1927 году. Принцип неопределенности 
    говорит о том, что невозможно одновременно точно измерить и положение, и импульс частицы.
    Уравнение Шрёдингера: iℏ∂ψ/∂t = Ĥψ. Это основное уравнение квантовой механики.
    Важные даты: 1900 - квантовая гипотеза Планка, 1925 - матричная механика Гейзенберга.
    Фотон является частицей света. Фотон не имеет массы.
    """
    
    print("=== ФИНАЛЬНЫЙ ТЕСТ ===")
    print("Исходный текст:")
    print(sample_text)
    print("\n" + "="*50 + "\n")
    
    result = enhance_text(sample_text)
    print("\nОбработанный текст:")
    print(result)
