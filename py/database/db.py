import sqlite3
import subprocess
from flask import Blueprint

DATABASE = 'running.db'
bp_db = Blueprint('db', __name__)

def dbConnection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    return conn, cursor

def backupDatabase():
    result = subprocess.run(f"sqlite3 {DATABASE} .dump > backup.sql", shell=True, check=True, capture_output=True, text=True)
    print("backupDatabase() Complete: ", result)

def loadDefaultDatabase():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    with open('mysql.sql', 'r') as f:
        sql_script = f.read()
    cursor.executescript(sql_script)
    conn.commit()
    conn.close()
    print("loadDefaultDatabase() run Complete: ")

@bp_db.route('/backupDatabase')
def backup_database_route():
    backupDatabase()
    print("backupDatabase button pressed")
    return 'Success', 204

@bp_db.route('/loadDefaultDatabase')
def resetDatabase():
    loadDefaultDatabase()
    print("loadDefaultDatabase button pressed")
    return 'Success', 204
