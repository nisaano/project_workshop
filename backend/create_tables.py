import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import init_db

def create_tables():
    """
    Создает все таблицы в базе данных
    """
    print("Создаём таблицы...")
    init_db()
    print("✅ Таблицы созданы успешно!")

if __name__ == "__main__":
    create_tables()