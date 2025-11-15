from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.db.session import init_db
from app.routers import auth, users, ai

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Инициализация базы данных...")
    init_db()
    print("База данных готова!")
    yield
    print("Приложение завершает работу...")

app = FastAPI(
    title="University Project API",
    description="API для проекта с интеграцией OpenAI и локального AI",
    version="1.0.0",
    lifespan=lifespan
)

# Настройка CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    settings.FRONTEND_URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутеры
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(ai.router)

@app.get("/")
async def root():
    return {
        "message": "University Project Backend is running!",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "University Project API"
    }
