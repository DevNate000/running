# py/login.py
from flask import render_template, request, session, jsonify
from db import dbConnection
import bcrypt
import app

def init_login_routes(app_instance):
    @app_instance.route('/login', methods=['GET'])
    def login_form():
        return render_template('login.html')

    @app_instance.route('/login_process', methods=['POST'])
    def login_process():
        username = request.form.get('username')
        password = request.form.get('password')

        conn, cursor = app.dbConnection()

        cursor.execute("SELECT * FROM Users WHERE username = ?", (username.lower(),))
        user = cursor.fetchone()

        if user and bcrypt.checkpw(password.encode('utf-8'), user['password']):
            session['user_id'] = user['user_id']
            session['username'] = user['name']
            session['team_tag'] = user['team_tag']
            conn.close()
            return jsonify({"logged_in": True})
        else:
            conn.close()
            return jsonify({"logged_in": False, "message": "Incorrect username or password."})
