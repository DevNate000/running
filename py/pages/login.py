from flask import render_template, request, session, jsonify, redirect, url_for
from py.database.db import dbConnection

def login():
    if request.method == 'POST':
        conn, cursor = dbConnection()
        username = request.form.get('username')
        password = request.form.get('password')
        cursor.execute("SELECT * FROM Users WHERE username = ?", (username.lower(),))
        user = cursor.fetchone()
        if user and password == user[4]:
            session['user_id'] = user['id']
            session['username'] = user['username']
            conn.close()
            return redirect(url_for('profile', username=username))
        else:
            conn.close()
            return render_template('login.html', error="Incorrect username or password.")
    else:
        return render_template('login.html')
