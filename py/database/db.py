import sqlite3
import subprocess

DATABASE = 'running.db'

def dbConnection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    return conn, cursor

def backupDatabase():
    result = subprocess.run(f"sqlite3 {DATABASE} .dump > backup.sql", shell=True, check=True, capture_output=True, text=True)
    print("Backup Complete: ", result)

def loadDefaultDatabase():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    with open('mysql.sql', 'r') as f:
        sql_script = f.read()
    cursor.executescript(sql_script)
    conn.commit()
    conn.close()
    print("Database Reset to Default")
