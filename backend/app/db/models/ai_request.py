from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.migrations.base import Base
import enum

class RequestType(enum.Enum):
    TEXT = "text"
    IMAGE = "image"

class ProcessingType(enum.Enum):
    SUMMARIZE = "summarize"
    ENHANCE = "enhance"
    EXTRACT_TERMS = "extract_terms"

class AIRequest(Base):
    __tablename__ = "ai_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)  # 'text' or 'image'
    processing_type = Column(String, nullable=False)  # 'summarize', 'enhance', etc.
    content = Column(Text, nullable=False)
    status = Column(String, default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Метаданные
    file_name = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)
    
    user = relationship("User", back_populates="ai_requests")

class AIResponse(Base):
    __tablename__ = "ai_responses"
    
    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("ai_requests.id"), nullable=False)
    
    # Результаты обработки
    openrouter_result = Column(Text)
    ml_enhanced_result = Column(Text)
    ocr_raw_text = Column(Text)
    final_result = Column(Text)
    
    # Статистика
    processing_time = Column(Float)
    key_terms = Column(JSON)
    word_count_original = Column(Integer)
    word_count_processed = Column(Integer)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    request = relationship("AIRequest", back_populates="response")

# Добавьте связь в существующую модель User
# В файле backend/app/db/models/user.py добавьте:
# ai_requests = relationship("AIRequest", back_populates="user")
