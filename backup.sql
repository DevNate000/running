PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT,
    last_name TEXT,
    password TEXT,
    age INTEGER,
    gender TEXT,
    location TEXT,
    profile_picture TEXT,
    creation_date TIMESTAMP,
    last_login TIMESTAMP
);
INSERT INTO users VALUES(1,'Nate','Stubbs','nate123!',19,'Male','NSB','nate_stubbs.jpg','2025-09-20 10:20:10','2025-09-23 10:20:10');
INSERT INTO users VALUES(2,'Ben','Zobrist','ben123!',44,'Male','MPS','ben_zobrist.png','2025-09-22 10:20:10','2025-09-25 10:20:10');
CREATE TABLE runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    miles INTEGER,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    start_location TEXT,
    end_location TEXT,
    weather_id INTEGER,
    is_legit BOOLEAN,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
INSERT INTO runs VALUES(1,1,3.16000000000000014,'2025-09-20 10:20:02','2025-09-20 10:50:10','NSB','NSB',1,1);
INSERT INTO runs VALUES(2,1,14.1600000000000001,'2025-09-21 14:08:50','2025-09-21 16:43:04','DTB','DTB',1,1);
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('users',2);
INSERT INTO sqlite_sequence VALUES('runs',2);
COMMIT;
