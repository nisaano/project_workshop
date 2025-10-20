from app.db.session import engine

conn = engine.connect()
print("PostgreSQL подключен!")
conn.close()