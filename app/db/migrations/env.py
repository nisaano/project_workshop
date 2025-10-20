import sys
import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

# путь до корня проекта, чтобы импорт работал
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../")))

from alembic import context
from app.core.config import settings
from app.db.session import Base
from app.models import user  # импортируем модели, чтобы Alembic их видел

# Alembic Config object
config = context.config

# Настройка логирования (по умолчанию)
fileConfig(config.config_file_name)

# Metadata для автогенерации
target_metadata = Base.metadata

# Настройка подключения к базе через settings
def get_url():
    return settings.DATABASE_URL

def run_migrations_offline():
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        url=get_url(),
        prefix='sqlalchemy.',
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

# Запуск
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
