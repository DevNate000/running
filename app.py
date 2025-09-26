from flask import Flask, render_template, request, redirect, url_for, jsonify, session, flash
from datetime import datetime


import sqlite3
import os

# time sqlite3 data.db .dump > backup.sql


app = Flask(__name__)
app.secret_key = 'e5f4a6d5f4ef0e4a7b2c8a7b3c2d13d1'  # Example key from an online generator

def dbConnection():
    conn = sqlite3.connect('running.db')
    cursor = conn.cursor()
    return conn, cursor

@app.route('/')
def index():
    conn, cursor = dbConnection()
    cursor.execute("SELECT * FROM users")
    users = cursor.fetchall()
    conn.close()

    return render_template('index.html', users=users)
