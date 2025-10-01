from flask import render_template
from py.database.db import dbConnection
def profile(username):
    conn, cursor = dbConnection()
    cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
    user_id = cursor.fetchone()[0]
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    cursor.execute("select SUM(MILES) from runnings where user_id = ?", (user_id,))
    total_miles = cursor.fetchone()[0]
    cursor.execute("SELECT route_coords FROM runnings WHERE user_id = ?", (user_id,))
    territory = cursor.fetchall()
    conn.close()
    # territory is a list of sqlite3.Row objects, convert to list of dicts
    territory = [dict(row) for row in territory]
    return render_template('profile.html', user=user, total_miles=total_miles, territory=territory)
