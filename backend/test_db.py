import sys
import os
from app.db.session import engine
from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_connection():
    """
    Тестирует подключение к базе данных
    """
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print("✅ Подключение к базе успешно!")
            print("Результат запроса:", result.scalar())

            # Дополнительная проверка - список таблиц
            tables = connection.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """))
            table_names = [row[0] for row in tables]
            print(f"✅ Найдено таблиц: {len(table_names)}")
            if table_names:
                print("Таблицы:", ", ".join(table_names))

    except Exception as e:
        print("❌ Ошибка подключения:", e)


def test_db_operations():
    """
    Тестирует основные операции с базой данных
    """
    try:
        from app.db.session import SessionLocal
        from app.db.models.user import User

        db = SessionLocal()
        user_count = db.query(User).count()
        print(f"✅ Пользователей в базе: {user_count}")

        db.close()

    except Exception as e:
        print("❌ Ошибка операций с базой:", e)


if __name__ == "__main__":
    print("🔍 Тестирование подключения к базе данных...")
    test_connection()

    print("\n🔍 Тестирование операций с базой данных...")
    test_db_operations()

    print("\n✅ Тестирование завершено!")