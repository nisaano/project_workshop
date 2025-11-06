from datetime import datetime, timedelta
from jose import jwt
from typing import Any, Dict
from app.core.config import settings


def create_access_token(data: dict) -> str:
    """
    Создает JWT токен доступа

    Args:
        data: Данные для кодирования в токен (обычно включает username/subject)

    Returns:
        str: Закодированный JWT токен
    """
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def verify_token(token: str) -> Dict[str, Any]:
    """
    Проверяет и декодирует JWT токен

    Args:
        token: JWT токен для проверки

    Returns:
        Dict: Декодированные данные токена

    Raises:
        JWTError: Если токен невалидный
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except jwt.JWTError:
        raise jwt.JWTError("Невалидный токен")


def create_refresh_token(data: dict) -> str:
    """
    Создает refresh токен с большим временем жизни

    Args:
        data: Данные для кодирования

    Returns:
        str: Refresh токен
    """
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire, "type": "refresh"})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt