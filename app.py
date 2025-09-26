from flask import Flask, render_template, request, redirect, url_for, jsonify, session, flash
from datetime import datetime


import sqlite3
import os

app = Flask(__name__)
app.secret_key = 'e5f4a6d5f4ef0e4a7b2c8a7b3c2d13d1'  # Example key from an online generator

@app.route('/')
def index():

    return render_template('index.html')
