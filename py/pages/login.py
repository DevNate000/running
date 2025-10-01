from flask import render_template
from py.database.db import dbConnection
def login():

    return render_template('login.html')

