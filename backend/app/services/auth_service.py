from sqlalchemy.orm import Session
from passlib.context import CryptContext
from fastapi import HTTPException, status
from app.db.models.user import User
from app.schemas.user import UserCreate

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


class AuthService:
    @staticmethod
    def get_password_hash(password: str) -> str:
        """
        Хеширует пароль с обработкой длинных паролей
        """
        if len(password.encode('utf-8')) > 72:
            import hashlib
            password = hashlib.sha256(password.encode('utf-8')).hexdigest()
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """
        Проверяет пароль с хешем
        """
        if len(plain_password.encode('utf-8')) > 72:
            import hashlib
            plain_password = hashlib.sha256(plain_password.encode('utf-8')).hexdigest()

        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def create_user(db: Session, user_data: UserCreate) -> User:
        """
        Создает нового пользователя в базе данных
        """
        existing_user = db.query(User).filter(
            (User.email == user_data.email) | (User.username == user_data.username)
        ).first()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь с таким email или username уже существует"
            )

        hashed_password = AuthService.get_password_hash(user_data.password)

        user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=hashed_password
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        return user

    @staticmethod
    def authenticate_user(db: Session, username: str, password: str) -> User | None:
        """
        Аутентифицирует пользователя по username и паролю
        """
        user = db.query(User).filter(User.username == username).first()

        if not user or not AuthService.verify_password(password, user.hashed_password):
            return None

        return user

    @staticmethod
    def get_user_by_username(db: Session, username: str) -> User | None:
        """
        Получает пользователя по username
        """
        return db.query(User).filter(User.username == username).first()

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> User | None:
        """
        Получает пользователя по email
        """
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def change_password(db: Session, user: User, new_password: str) -> User:
        """
        Изменяет пароль пользователя
        """
        user.hashed_password = AuthService.get_password_hash(new_password)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def deactivate_user(db: Session, user: User) -> User:
        """
        Деактивирует пользователя
        """
        user.is_active = False
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def activate_user(db: Session, user: User) -> User:
        """
        Активирует пользователя
        """
        user.is_active = True
        db.commit()
        db.refresh(user)
        return user