# app.py (пример для Flask)
from flask import Flask, request, jsonify
from database import init_db, User, Post
from db_operations import DatabaseOperations

app = Flask(__name__)
session, engine = init_db()
db_ops = DatabaseOperations(session)

@app.route('/posts')
def get_posts():
    posts = db_ops.get_published_posts(limit=10)
    return jsonify([{
        'id': post.id,
        'title': post.title,
        'author': post.author.username
    } for post in posts])

@app.route('/posts/<int:post_id>/like', methods=['POST'])
def like_post(post_id):
    user_id = request.json.get('user_id')
    if db_ops.like_post(user_id, post_id):
        return jsonify({'success': True})
    return jsonify({'error': 'Уже лайкнуто'}), 400

if __name__ == '__main__':
    app.run(debug=True)
