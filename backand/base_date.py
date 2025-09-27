# database.py
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship, sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# 1. Создаем базовый класс для всех моделей
Base = declarative_base()

# 2. Таблица для связи многие-ко-многим: лайки постов
post_likes = Table(
    'post_likes',  # имя таблицы в БД
    Base.metadata,  # метаданные базы
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('post_id', Integer, ForeignKey('posts.id'), primary_key=True),
    Column('liked_at', DateTime, default=datetime.utcnow)  # когда лайкнули
)

# 3. Таблица для подписок (кто на кого подписан)
followers = Table(
    'followers',
    Base.metadata,
    Column('follower_id', Integer, ForeignKey('users.id'), primary_key=True),  # кто подписывается
    Column('followed_id', Integer, ForeignKey('users.id'), primary_key=True),  # на кого подписываются
    Column('followed_at', DateTime, default=datetime.utcnow)  # когда подписались
)

# 4. Модель Пользователя
class User(Base):
    __tablename__ = 'users'  # имя таблицы в БД
    
    # Основные поля пользователя
    id = Column(Integer, primary_key=True, autoincrement=True)  # уникальный ID
    username = Column(String(50), unique=True, nullable=False)  # логин (уникальный)
    email = Column(String(100), unique=True, nullable=False)    # email (уникальный)
    password_hash = Column(String(255), nullable=False)         # хеш пароля
    first_name = Column(String(50))                             # имя
    last_name = Column(String(50))                              # фамилия
    bio = Column(Text)                                          # о себе
    avatar_url = Column(String(255))                            # ссылка на аватар
    is_active = Column(Boolean, default=True)                   # активен ли аккаунт
    is_admin = Column(Boolean, default=False)                   # является ли админом
    created_at = Column(DateTime, default=datetime.utcnow)      # когда создан
    updated_at = Column(DateTime, onupdate=datetime.utcnow)     # когда обновлен
    
    # Связи с другими таблицами
    posts = relationship("Post", back_populates="author")       # посты пользователя
    comments = relationship("Comment", back_populates="author") # комментарии пользователя
    liked_posts = relationship("Post", secondary=post_likes, back_populates="likers")  # лайкнутые посты
    
    # Подписки: кто на меня подписан и на кого я подписан
    followed = relationship(
        "User",  # связь с самой собой
        secondary=followers,  # через таблицу followers
        primaryjoin=(followers.c.follower_id == id),  # я - подписчик
        secondaryjoin=(followers.c.followed_id == id),  # другой пользователь - на кого подписан
        backref="followers"  # обратная ссылка для получения подписчиков
    )
    
    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}')>"

# 5. Модель Поста (статьи/записи)
class Post(Base):
    __tablename__ = 'posts'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False)                 # заголовок поста
    content = Column(Text, nullable=False)                      # содержание поста
    excerpt = Column(String(300))                               # краткое описание
    slug = Column(String(200), unique=True)                     # ЧПУ-ссылка
    image_url = Column(String(255))                             # картинка поста
    is_published = Column(Boolean, default=False)               # опубликован ли
    view_count = Column(Integer, default=0)                     # количество просмотров
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    published_at = Column(DateTime)                             # когда опубликован
    
    # Внешние ключи
    author_id = Column(Integer, ForeignKey('users.id'), nullable=False)  # автор поста
    category_id = Column(Integer, ForeignKey('categories.id'))           # категория
    
    # Связи
    author = relationship("User", back_populates="posts")       # автор поста
    category = relationship("Category", back_populates="posts") # категория поста
    comments = relationship("Comment", back_populates="post")   # комментарии к посту
    likers = relationship("User", secondary=post_likes, back_populates="liked_posts")  # кто лайкнул
    
    def __repr__(self):
        return f"<Post(id={self.id}, title='{self.title}')>"

# 6. Модель Комментария
class Comment(Base):
    __tablename__ = 'comments'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    content = Column(Text, nullable=False)                      # текст комментария
    is_approved = Column(Boolean, default=True)                 # одобрен ли модератором
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    
    # Внешние ключи
    author_id = Column(Integer, ForeignKey('users.id'), nullable=False)  # автор коммента
    post_id = Column(Integer, ForeignKey('posts.id'), nullable=False)    # к какому посту
    parent_id = Column(Integer, ForeignKey('comments.id'))               # родительский комментарий (для веток)
    
    # Связи
    author = relationship("User", back_populates="comments")    # автор коммента
    post = relationship("Post", back_populates="comments")      # пост коммента
    parent = relationship("Comment", remote_side=[id], backref="replies")  # древовидные комментарии
    
    def __repr__(self):
        return f"<Comment(id={self.id}, author_id={self.author_id})>"

# 7. Модель Категории
class Category(Base):
    __tablename__ = 'categories'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False)      # название категории
    slug = Column(String(50), unique=True)                      # ЧПУ-ссылка
    description = Column(Text)                                  # описание категории
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Связь с постами
    posts = relationship("Post", back_populates="category")     # посты в этой категории
    
    def __repr__(self):
        return f"<Category(id={self.id}, name='{self.name}')>"

# 8. Модель Настроек сайта
class SiteSettings(Base):
    __tablename__ = 'site_settings'
    
    id = Column(Integer, primary_key=True)
    site_name = Column(String(100), default="Мой сайт")         # название сайта
    site_description = Column(Text)                             # описание сайта
    admin_email = Column(String(100))                           # email администратора
    posts_per_page = Column(Integer, default=10)                # постов на страницу
    comments_enabled = Column(Boolean, default=True)            # разрешены ли комментарии
    registration_enabled = Column(Boolean, default=True)        # разрешена ли регистрация
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<SiteSettings(id={self.id})>"

# 9. Функции для работы с базой данных
def init_db(database_url="sqlite:///website.db"):
    """Инициализация базы данных"""
    # Создаем движок для подключения к БД
    engine = create_engine(database_url)
    
    # Создаем все таблицы
    Base.metadata.create_all(engine)
    
    # Создаем фабрику сессий
    Session = sessionmaker(bind=engine)
    session = Session()
    
    return session, engine

def create_default_data(session):
    """Создание тестовых данных"""
    # Создаем администратора
    admin = User(
        username="admin",
        email="admin@example.com",
        password_hash="hashed_password_123",  # в реальности нужно хешировать!
        first_name="Администратор",
        is_admin=True
    )
    
    # Создаем обычного пользователя
    user1 = User(
        username="ivan",
        email="ivan@example.com",
        password_hash="hashed_password_456",
        first_name="Иван",
        last_name="Петров"
    )
    
    # Создаем категории
    tech_category = Category(name="Технологии", slug="technology")
    news_category = Category(name="Новости", slug="news")
    
    # Добавляем в сессию
    session.add_all([admin, user1, tech_category, news_category])
    session.commit()
    
    # Создаем настройки сайта
    settings = SiteSettings(
        site_name="Мой блог",
        site_description="Лучший блог о технологиях",
        admin_email="admin@example.com"
    )
    session.add(settings)
    session.commit()

# 10. Пример использования
if __name__ == "__main__":
    # Инициализируем базу данных
    session, engine = init_db()
    
    # Создаем тестовые данные
    create_default_data(session)
    
    print("База данных успешно создана!")
    
    # Пример запроса: получаем всех пользователей
    users = session.query(User).all()
    for user in users:
        print(f"Пользователь: {user.username} ({user.email})")
    
    session.close()
