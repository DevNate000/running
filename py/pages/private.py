from flask import render_template
from py.database.db_queries import dbMainLeaderboardRuns
def private():
    mainRunningStats = dbMainLeaderboardRuns()
    return render_template('private.html', mainRunningStats=mainRunningStats)
