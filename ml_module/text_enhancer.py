import re
import string
from collections import Counter
from typing import List, Set, Tuple
import heapq

class AdvancedTextEnhancer:
    def __init__(self):
        # Умные стоп-слова с весами
        self.stop_words = self._load_stop_words()
        
        # Паттерны для важных элементов
        self.patterns = {
            'dates': [
                r'\b\d{1,2}\.\d{1,2}\.\d{4}\b',
                r'\b\d{4}\.\d{1,2}\.\d{1,2}\b',
                r'\b\d{1,2}/\d{1,2}/\d{4}\b',
                r'\b\d{4}-\d{1,2}-\d{1,2}\b',
                r'\b\d{4}\b'
            ],
            'acronyms': r'\b[A-ZА-Я]{2,6}\b',
            'numbers': r'\b\d+[.,]?\d*\b',
            'capitalized': r'\b[А-ЯA-Z][а-яa-z]{3,}\b'
        }
        
        # Тематические индикаторы (слова, указывающие на важность)
        self.importance_indicators = {
            'определение': 3, 'понятие': 2, 'термин': 3, 'концепция': 3,
            'теория': 2, 'метод': 2, 'алгоритм': 3, 'формула': 3,
            'закон': 3, 'принцип': 2, 'свойство': 2, 'функция': 2,
            'структура': 2, 'процесс': 2, 'система': 2, 'модель': 2,
            'важно': 1, 'ключевой': 2, 'основной': 2, 'главный': 2
        }

    def _load_stop_words(self) -> Set[str]:
        """Загружает расширенный список стоп-слов"""
        base_stop_words = {
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
        
        # Добавляем местоимения и вспомогательные глаголы
        pronouns = {'я', 'ты', 'он', 'она', 'оно', 'мы', 'вы', 'они', 'себя'}
        verbs = {'есть', 'быть', 'стать', 'являться', 'называться', 'считаться'}
        
        return base_stop_words | pronouns | verbs

    def _calculate_sentence_importance(self, sentence: str, key_terms: Set[str]) -> float:
        """Рассчитывает важность предложения"""
        words = self._tokenize_text(sentence.lower())
        
        importance_score = 0
        
        # Учитываем ключевые термины
        term_count = sum(1 for word in words if word in key_terms)
        importance_score += term_count * 2
        
        # Учитываем индикаторы важности
        for indicator, weight in self.importance_indicators.items():
            if indicator in sentence.lower():
                importance_score += weight
        
        # Учитываем длину предложения (средние предложения обычно важнее)
        word_count = len(words)
        if 8 <= word_count <= 25:
            importance_score += 1
        
        return importance_score

    def _tokenize_text(self, text: str) -> List[str]:
        """Токенизирует текст с улучшенной обработкой"""
        # Убираем пунктуацию, но сохраняем дефисы в словах
        text = re.sub(r'[^\w\s-]', ' ', text)
        words = text.lower().split()
        
        # Фильтруем стоп-слова и короткие слова
        return [word for word in words if word not in self.stop_words and len(word) > 2]

    def remove_repetitive_phrases(self, text: str) -> str:
        """Умное удаление повторяющихся фраз с сохранением смысла"""
        sentences = self._split_into_sentences(text)
        
        if len(sentences) <= 1:
            return text
        
        # Извлекаем ключевые термины для оценки важности
        all_words = []
        for sentence in sentences:
            all_words.extend(self._tokenize_text(sentence))
        
        word_freq = Counter(all_words)
        key_terms = {word for word, count in word_freq.most_common(10) if count >= 2}
        
        # Оцениваем важность каждого предложения
        scored_sentences = []
        for i, sentence in enumerate(sentences):
            score = self._calculate_sentence_importance(sentence, key_terms)
            scored_sentences.append((score, i, sentence))
        
        # Сортируем по важности и берем топ-80% предложений
        scored_sentences.sort(reverse=True)
        keep_count = max(3, int(len(sentences) * 0.8))  # Сохраняем минимум 3 предложения
        kept_sentences = [sentence for _, _, sentence in scored_sentences[:keep_count]]
        
        # Восстанавливаем порядок
        kept_indices = sorted([i for _, i, _ in scored_sentences[:keep_count]])
        final_sentences = [sentences[i] for i in kept_indices]
        
        return ' '.join(final_sentences)

    def _split_into_sentences(self, text: str) -> List[str]:
        """Улучшенное разделение на предложения"""
        # Разделяем по точкам, восклицательным и вопросительным знакам
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        return sentences

    def improve_paragraph_structure(self, text: str) -> str:
        """Улучшает структуру текста с семантической группировкой"""
        sentences = self._split_into_sentences(text)
        
        if len(sentences) <= 2:
            return text
        
        # Группируем предложения по темам (простая эвристика)
        paragraphs = []
        current_paragraph = []
        
        for i, sentence in enumerate(sentences):
            current_paragraph.append(sentence)
            
            # Начинаем новый параграф если:
            # 1. Достигли 2-3 предложений И следующее предложение начинается с нового предложения
            # 2. В предложении есть маркеры начала новой темы
            should_break = (
                (len(current_paragraph) >= 2 and i < len(sentences) - 1 and
                 self._is_new_topic(sentences[i], sentences[i+1])) or
                len(current_paragraph) >= 3 or
                any(marker in sentence.lower() for marker in ['таким образом', 'в заключение', 'кроме того'])
            )
            
            if should_break and current_paragraph:
                paragraphs.append(' '.join(current_paragraph))
                current_paragraph = []
        
        # Добавляем оставшиеся предложения
        if current_paragraph:
            paragraphs.append(' '.join(current_paragraph))
        
        return '\n\n'.join(paragraphs)

    def _is_new_topic(self, current_sentence: str, next_sentence: str) -> bool:
        """Определяет, начинается ли новая тема"""
        new_topic_indicators = [
            'также', 'кроме', 'однако', 'поэтому', 'следовательно',
            'в результате', 'в отличие', 'например', 'в частности'
        ]
        
        next_lower = next_sentence.lower()
        return any(indicator in next_lower for indicator in new_topic_indicators)

    def extract_key_terms(self, text: str, top_n: int = 8) -> List[str]:
        """Извлекает ключевые термины с учетом контекста"""
        words = self._tokenize_text(text)
        
        # Учитываем составные термины (2-3 слова)
        bigrams = [f"{words[i]} {words[i+1]}" for i in range(len(words)-1)]
        trigrams = [f"{words[i]} {words[i+1]} {words[i+2]}" for i in range(len(words)-2)]
        
        all_terms = words + bigrams + trigrams
        
        # Взвешиваем термины
        term_weights = {}
        for term in all_terms:
            term_weights[term] = term_weights.get(term, 0) + 1
            
            # Увеличиваем вес для длинных терминов и терминов с заглавными буквами
            if any(word.istitle() for word in term.split()):
                term_weights[term] += 2
            if len(term) > 10:
                term_weights[term] += 1
        
        # Выбираем топ-N терминов
        top_terms = heapq.nlargest(top_n * 2, term_weights.items(), key=lambda x: x[1])
        
        # Фильтруем слишком общие термины
        filtered_terms = []
        for term, score in top_terms:
            if (score >= 2 and 
                len(term) >= 4 and 
                not self._is_too_general(term)):
                filtered_terms.append(term)
        
        return filtered_terms[:top_n]

    def _is_too_general(self, term: str) -> bool:
        """Проверяет, не является ли термин слишком общим"""
        general_terms = {
            'может быть', 'также как', 'однако это', 'кроме того',
            'в том числе', 'поэтому можно', 'следует отметить'
        }
        return term in general_terms

    def highlight_key_elements(self, text: str) -> str:
        """Выделяет ключевые элементы в тексте"""
        enhanced_text = text
        
        # 1. Выделяем даты
        for pattern in self.patterns['dates']:
            dates = re.findall(pattern, enhanced_text)
            for date in set(dates):
                enhanced_text = enhanced_text.replace(date, f'**{date}**')
        
        # 2. Выделяем ключевые термины
        key_terms = self.extract_key_terms(enhanced_text)
        
        # Сортируем по длине (сначала длинные, чтобы избежать конфликтов)
        key_terms.sort(key=len, reverse=True)
        
        for term in key_terms:
            # Избегаем повторного выделения
            if f'**{term}**' not in enhanced_text:
                # Используем границы слов для точного совпадения
                pattern = r'\b' + re.escape(term) + r'\b'
                enhanced_text = re.sub(pattern, f'**{term}**', enhanced_text, flags=re.IGNORECASE)
        
        # 3. Выделяем акронимы и важные capitalized слова
        acronyms = re.findall(self.patterns['acronyms'], enhanced_text)
        for acronym in set(acronyms):
            if f'**{acronym}**' not in enhanced_text:
                enhanced_text = enhanced_text.replace(acronym, f'**{acronym}**')
        
        return enhanced_text

    def process_text(self, text: str) -> str:
        """Основная функция обработки текста"""
        if not text or len(text.strip()) < 50:
            return text
        
        print("🔧 Начата обработка текста...")
        
        # 1. Удаляем повторяющиеся фразы (умное удаление)
        text_no_repeats = self.remove_repetitive_phrases(text)
        print("✓ Удалены повторяющиеся и маловажные фразы")
        
        # 2. Улучшаем структуру абзацев
        structured_text = self.improve_paragraph_structure(text_no_repeats)
        print("✓ Улучшена структура текста")
        
        # 3. Выделяем ключевые элементы
        final_text = self.highlight_key_elements(structured_text)
        print("✓ Выделены ключевые термины и элементы")
        
        return final_text

# Функция для обратной совместимости
def enhance_text(text: str) -> str:
    enhancer = AdvancedTextEnhancer()
    return enhancer.process_text(text)

# Простой тест для проверки работы
if __name__ == "__main__":
    sample_text = """
    Квантовая механика описывает поведение частиц на атомном и субатомном уровнях. 
    Квантовая механика является фундаментальной теорией в физике. Волновая функция 
    является ключевым понятием в квантовой механике. Волновая функция описывает 
    состояние квантовой системы. Принцип неопределенности Гейзенберга был сформулирован 
    в 1927 году. Принцип неопределенности Гейзенберга говорит о том, что невозможно 
    одновременно точно измерить и положение, и импульс частицы.
    """
    
    print("=== ТЕСТ ML-МОДУЛЯ ===")
    result = enhance_text(sample_text)
    print("\nРезультат:")
    print(result)
