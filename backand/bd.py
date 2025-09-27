# db_operations.py
from datetime import datetime
from sqlalchemy import or_, and_

class DatabaseOperations:
    def __init__(self, session):
        self.session = session
    
    # Операции с пользователями
    def create_user(self, username, email, password_hash, **kwargs):
        """Создание нового пользователя"""
        user = User(
            username=username,
            email=email,
            password_hash=password_hash,
            **kwargs
        )
        self.session.add(user)
        self.session.commit()
        return user
    
    def get_user_by_id(self, user_id):
        """Получить пользователя по ID"""
        return self.session.query(User).filter(User.id == user_id).first()
    
    def get_user_by_email(self, email):
        """Получить пользователя по email"""
        return self.session.query(User).filter(User.email == email).first()
    
    # Операции с постами
    def create_post(self, title, content, author_id, **kwargs):
        """Создание нового поста"""
        post = Post(
            title=title,
            content=content,
            author_id=author_id,
            **kwargs
        )
        self.session.add(post)
        self.session.commit()
        return post
    
    def get_published_posts(self, limit=10):
        """Получить опубликованные посты"""
        return self.session.query(Post).filter(
            Post.is_published == True
        ).order_by(Post.published_at.desc()).limit(limit).all()
    
    def search_posts(self, query):
        """Поиск постов по заголовку и содержанию"""
        return self.session.query(Post).filter(
            or_(
                Post.title.ilike(f"%{query}%"),
                Post.content.ilike(f"%{query}%")
            ),
            Post.is_published == True
        ).all()
    
    # Операции с комментариями
    def add_comment(self, content, author_id, post_id, parent_id=None):
        """Добавление комментария"""
        comment = Comment(
            content=content,
            author_id=author_id,
            post_id=post_id,
            parent_id=parent_id
        )
        self.session.add(comment)
        self.session.commit()
        return comment
    
    def get_post_comments(self, post_id):
        """Получить комментарии к посту"""
        return self.session.query(Comment).filter(
            Comment.post_id == post_id,
            Comment.is_approved == True
        ).order_by(Comment.created_at.asc()).all()
    
    # Операции с лайками
    def like_post(self, user_id, post_id):
        """Лайкнуть пост"""
        # Проверяем, не лайкнул ли уже
        existing_like = self.session.query(post_likes).filter(
            post_likes.c.user_id == user_id,
            post_likes.c.post_id == post_id
        ).first()
        
        if not existing_like:
            # Добавляем лайк
            self.session.execute(
                post_likes.insert().values(
                    user_id=user_id,
                    post_id=post_id,
                    liked_at=datetime.utcnow()
                )
            )
            self.session.commit()
            return True
        return False
    
    def get_post_likes_count(self, post_id):
        """Получить количество лайков поста"""
        return self.session.query(post_likes).filter(
            post_likes.c.post_id == post_id
        ).count()

# Пример использования
if __name__ == "__main__":
    from database import init_db
    
    # Инициализируем БД
    session, engine = init_db()
    db_ops = DatabaseOperations(session)
    
    # Создаем пост
    post = db_ops.create_post(
        title="Мой первый пост",
        content="Это содержание моего первого поста...",
        author_id=1,
        is_published=True,
        published_at=datetime.utcnow()
    )
    
    print(f"Создан пост: {post.title}")
