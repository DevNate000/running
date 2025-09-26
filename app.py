from flask import Flask, render_template, request, redirect, url_for, jsonify, session, flash
from datetime import datetime


import sqlite3
import os
import subprocess
import json

# time sqlite3 running.db .dump > backup.sql

app = Flask(__name__)
app.secret_key = 'e5f4a6d5f4ef0e4a7b2c8a7b3c2d13d1'

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










# API: Get all runs
@app.route('/api/runs', methods=['GET'])
def api_get_runs():
    conn, cursor = dbConnection()
    cursor.execute("SELECT id, name, route_coords, miles, time, created_at FROM runnings")
    rows = cursor.fetchall()
    conn.close()
    runs = []
    for row in rows:
        runs.append({
            'id': row[0],
            'name': row[1],
            'route_coords': row[2],
            'miles': row[3],
            'time': row[4],
            'created_at': row[5]
        })
    return jsonify(runs)

# API: Add a new run
@app.route('/api/runs', methods=['POST'])
def api_add_run():
    data = request.get_json()
    name = data.get('name')
    route_coords = json.dumps(data.get('route_coords'))
    miles = data.get('miles')
    time_val = data.get('time')
    conn, cursor = dbConnection()
    cursor.execute("INSERT INTO runnings (name, route_coords, miles, time) VALUES (?, ?, ?, ?)",
                   (name, route_coords, miles, time_val))
    conn.commit()
    run_id = cursor.lastrowid
    cursor.execute("SELECT id, name, route_coords, miles, time, created_at FROM runnings WHERE id = ?", (run_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        run = {
            'id': row[0],
            'name': row[1],
            'route_coords': row[2],
            'miles': row[3],
            'time': row[4],
            'created_at': row[5]
        }
        return jsonify({'success': True, 'run': run})
    else:
        return jsonify({'success': False}), 400

# API: Delete a run
@app.route('/api/runs/<int:run_id>', methods=['DELETE'])
def api_delete_run(run_id):
    conn, cursor = dbConnection()
    cursor.execute("DELETE FROM runnings WHERE id = ?", (run_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})


if __name__ == '__main__':
    app.run(debug=True)
