from py.database.db import dbConnection, backupDatabase, loadDefaultDatabase



def dbRunsQuery(where):
    runsQuery = f"""
        SELECT runnings.id, runnings.user_id, users.first_name || ' ' || users.last_name as name, runnings.route_coords, runnings.miles, runnings.time, runnings.created_at, users.color, users.profile_picture, users.username
        FROM runnings
        LEFT JOIN users ON runnings.user_id = users.id
        {where}
        ORDER BY miles desc
        """
    return runsQuery


def getSomeRunInfo():
    conn, _ = dbConnection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM runnings LEFT JOIN users ON runnings.user_id = users.id WHERE user_id != 2 ORDER BY miles DESC")
    mainRunningStats = cursor.fetchall()
    conn.close()

    return mainRunningStats
