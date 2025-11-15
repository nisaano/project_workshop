from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models.user import User
from app.core.security import create_access_token
from app.schemas.user import UserCreate, UserResponse, Token, LoginRequest
from app.services.auth_service import AuthService
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=UserResponse)
async def register(
        user_data: UserCreate,
        db: Session = Depends(get_db)
):
    """
    Регистрация нового пользователя
    """

    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email или username уже существует"
        )

    user = AuthService.create_user(db, user_data)

    return user

@router.post("/login", response_model=Token)
async def login(
        form_data: OAuth2PasswordRequestForm = Depends(),
        db: Session = Depends(get_db)
):
    """
    Аутентификация пользователя и выдача JWT токена
    """
    user = AuthService.authenticate_user(
        db, form_data.username, form_data.password
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверные учетные данные",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь неактивен"
        )


    access_token = create_access_token(
        data={"sub": user.username}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user.username,
        "email": user.email
    }


@router.post("/login-json", response_model=Token)
async def login_json(
        login_data: LoginRequest,
        db: Session = Depends(get_db)
):
    """
    Аутентификация пользователя через JSON
    """
    user = AuthService.authenticate_user(
        db, login_data.username, login_data.password
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверные учетные данные",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь неактивен"
        )

    access_token = create_access_token(
        data={"sub": user.username}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user.username,
        "email": user.email
    }


@router.get("/me", response_model=UserResponse)
async def read_users_me(
        current_user: User = Depends(get_current_user)
):
    """
    Получить информацию о текущем пользователе
    """
    return current_user


@router.post("/verify-token")
async def verify_token_endpoint(token: str):
    """
    Проверить валидность токена
    """
    try:
        from app.core.security import verify_token
        payload = verify_token(token)
        return {"valid": True, "username": payload.get("sub")}
    except Exception:
        return {"valid": False}