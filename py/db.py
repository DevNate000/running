import sqlite3
import subprocess

DATABASE = 'running.db'

def dbConnection():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    return conn, cursor


def backupDatabase():
    result = subprocess.run("sqlite3 ", DATABASE, " .dump > backup.sql", shell=True, check=True, capture_output=True, text=True)

    print("HERE", result)
    print("DONE:", result.stdout)
    if result.stdout:
        print("Stdout:", result.stdout)
