from sqlalchemy.ext.declarative import declarative_base
from app.db.models.user import User
from app.db.models.note import Note

Base = declarative_base()
__all__ = ['Base', 'User', 'Note']