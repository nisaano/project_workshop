from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.dependencies import get_current_user, get_current_admin
from app.db.session import get_db
from app.db.models.user import User
from app.schemas.user import UserOut, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Получить информацию о текущем пользователе
    """
    return current_user


@router.put("/me", response_model=UserOut)
async def update_me(
        user_update: UserUpdate,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Обновить информацию текущего пользователя
    """
    update_data = user_update.dict(exclude_unset=True)

    for field, value in update_data.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)

    return current_user


@router.get("/", response_model=List[UserOut])
async def get_all_users(
        admin: User = Depends(get_current_admin),
        db: Session = Depends(get_db),
        skip: int = 0,
        limit: int = 100
):
    """
    Получить список всех пользователей (только для администраторов)
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.get("/{user_id}", response_model=UserOut)
async def get_user_by_id(
        user_id: int,
        admin: User = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """
    Получить пользователя по ID (только для администраторов)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    return user


@router.delete("/{user_id}")
async def delete_user(
        user_id: int,
        admin: User = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """
    Удалить пользователя (только для администраторов)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )

    db.delete(user)
    db.commit()

    return {"message": "Пользователь удален"}


@router.patch("/{user_id}/activate")
async def activate_user(
        user_id: int,
        admin: User = Depends(get_current_admin),
        db: Session = Depends(get_db)
):
    """
    Активировать/деактивировать пользователя (только для администраторов)
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )

    user.is_active = not user.is_active
    db.commit()

    status_text = "активирован" if user.is_active else "деактивирован"
    return {"message": f"Пользователь {status_text}"}