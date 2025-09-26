from flask import Flask, render_template, request, redirect, url_for, jsonify, session, flash
from datetime import datetime


import sqlite3
import os
import subprocess

# time sqlite3 running.db .dump > backup.sql


app = Flask(__name__)
app.secret_key = 'e5f4a6d5f4ef0e4a7b2c8a7b3c2d13d1'  # Example key from an online generator

def dbConnection():
    conn = sqlite3.connect('running.db')
    cursor = conn.cursor()
    return conn, cursor

def backupDatabase():
    result = subprocess.run("sqlite3 running.db .dump > backup.sql", shell=True, check=True, capture_output=True, text=True)

    print("HERE", result)
    print("DONE:", result.stdout)
    if result.stdout:
        print("Stdout:", result.stdout)


@app.route('/')
def index():
    conn, cursor = dbConnection()
    cursor.execute("SELECT * FROM users")
    users = cursor.fetchall()
    conn.close()


    ## Create button for this. backupDatabase()

    return render_template('index.html', users=users)

@app.route('/index2')
def index2():

    return render_template('index2.html')

@app.route('/maps')
def maps():

    return render_template('maps.html')

@app.route('/working')
def working():

    return render_template('working.html')
