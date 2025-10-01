from flask import Flask, render_template, request, redirect, url_for, jsonify, session, flash
from datetime import datetime
from urllib.parse import urlparse


import sqlite3
import os
import subprocess
import json

# time sqlite3 running.db .dump > backup.sql

app = Flask(__name__)
app.secret_key = 'e5f4a6d5f4ef0e4a7b2c8a7b3c2d13d1'
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


@app.route('/login')
def login():
    return render_template('login.html')


@app.route('/old_index')
def old_index():
    conn, cursor = dbConnection()
    cursor.execute("SELECT * FROM users")
    users = cursor.fetchall()
    conn.close()

    backupDatabase()


    ## Create button for this. backupDatabase()

    return render_template('old_index.html', users=users)

@app.route('/index2')
def index2():

    return render_template('index2.html')

@app.route('/maps')
def maps():

    return render_template('maps.html')

@app.route('/')
def public():
    return render_template('public.html')

@app.route('/private')
def private():
    return render_template('private.html')



def dbRunsQuery(condition):
    runsQuery = f"""
        SELECT runnings.id, runnings.user_id, users.first_name || ' ' || users.last_name as name, runnings.route_coords, runnings.miles, runnings.time, runnings.created_at, users.color, users.profile_picture
        FROM runnings
        LEFT JOIN users ON runnings.user_id = users.id
        {condition}
        ORDER BY miles desc
        """
    return runsQuery

logged_in_user_id = 3


@app.route('/api/runs', methods=['GET'])
def api_get_runs():
    conn, cursor = dbConnection()

    page = urlparse(request.referrer).path.strip('/').split('/')[-1]

    if page == 'private':
        if logged_in_user_id == 1:
            queryCondition = 'WHERE user_id IN (1,2)'
        else:
            queryCondition = f'WHERE user_id = {logged_in_user_id}'
    else:
        queryCondition = 'WHERE user_id != 2'

    cursor.execute(dbRunsQuery(queryCondition))

    rows = cursor.fetchall()
    conn.close()
    runs = []
    for row in rows:
        miles = row[4]
        time_str = row[5]
        pace = None
        if miles and time_str:
            # Parse time (hh:mm:ss or mm:ss)
            parts = [int(x) for x in time_str.split(":")]
            if len(parts) == 3:
                total_seconds = parts[0]*3600 + parts[1]*60 + parts[2]
            elif len(parts) == 2:
                total_seconds = parts[0]*60 + parts[1]
            else:
                total_seconds = 0
            if miles > 0:
                pace_sec = total_seconds / float(miles)
                pace_min = int(pace_sec // 60)
                pace_rem = int(round(pace_sec % 60))
                pace = f"{pace_min}:{pace_rem:02d}"
        runs.append({
            'id': row[0],
            'user_id': row[1],
            'name': row[2] or '',
            'route_coords': row[3],
            'miles': miles,
            'time': time_str,
            'created_at': row[6],
            'color': row[7] or 'green',
            'pace': pace,
            'profile_picture': row[8] or 'default'
        })
    return jsonify(runs)


# API: Add a new run (expects user_id)
@app.route('/api/runs', methods=['POST'])
def api_add_run():
    data = request.get_json()
    # user_id = data.get('user_id') get the login user_id
    route_coords = json.dumps(data.get('route_coords'))
    miles = data.get('miles')
    time_val = data.get('time')
    conn, cursor = dbConnection()
    cursor.execute("INSERT INTO runnings (user_id, route_coords, miles, time) VALUES (?, ?, ?, ?)",
                   (logged_in_user_id, route_coords, miles, time_val))
    conn.commit()
    run_id = cursor.lastrowid
    cursor.execute("""
        SELECT runnings.id, runnings.user_id, users.first_name || ' ' || users.last_name as name, runnings.route_coords, runnings.miles, runnings.time, runnings.created_at, users.color
        FROM runnings
        LEFT JOIN users ON runnings.user_id = users.id
        WHERE runnings.id = ?
    """, (run_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        miles = row[4]
        time_str = row[5]
        pace = None
        if miles and time_str:
            parts = [int(x) for x in time_str.split(":")]
            if len(parts) == 3:
                total_seconds = parts[0]*3600 + parts[1]*60 + parts[2]
            elif len(parts) == 2:
                total_seconds = parts[0]*60 + parts[1]
            else:
                total_seconds = 0
            if miles > 0:
                pace_sec = total_seconds / float(miles)
                pace_min = int(pace_sec // 60)
                pace_rem = int(round(pace_sec % 60))
                pace = f"{pace_min}:{pace_rem:02d}"
        run = {
            'id': row[0],
            'user_id': row[1],
            'name': row[2] or '',
            'route_coords': row[3],
            'miles': miles,
            'time': time_str,
            'created_at': row[6],
            'color': row[7] or 'green',
            'pace': pace
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
