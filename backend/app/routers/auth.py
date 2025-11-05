from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from app.db.session import get_db
from app.models.user import User
from app.core.security import create_access_token
from app.schemas.user import UserCreate, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    password_str = password_bytes.decode("utf-8", errors="ignore")
    return pwd_context.hash(password_str)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    encoded = plain_password.encode("utf-8")[:72]
    return pwd_context.verify(encoded, hashed_password)

@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=UserOut)
def register(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email уже используется")
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username уже используется")

    password_hash = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=password_hash
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.username == form_data.username) | (User.email == form_data.username)
    ).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль"
        )
    access_token = create_access_token({"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}
