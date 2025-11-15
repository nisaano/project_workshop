from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.migrations.base import Base

engine = create_engine(
    "postgresql+psycopg2://postgres:Sa006011@localhost:5432/project_db",
    connect_args={
        'options': '-c client_encoding=utf8'
    },
    echo=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()