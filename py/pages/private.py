from flask import render_template
from py.database.db_queries import getSomeRunInfo
def private():
    mainRunningStats = getSomeRunInfo()
    return render_template('private.html', mainRunningStats=mainRunningStats)
