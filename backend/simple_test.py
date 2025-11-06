import psycopg2

print("🔍 Простой тест PostgreSQL...")

try:
    conn = psycopg2.connect(
        host="localhost",
        port="5432",
        user="postgres",
        password="12345",
        database="project_db"
    )

    cur = conn.cursor()
    cur.execute("SELECT 1 as test")
    result = cur.fetchone()
    print(f"✅ PostgreSQL подключение работает: {result[0]}")

    cur.close()
    conn.close()

except Exception as e:
    print(f"❌ Ошибка: {e}")