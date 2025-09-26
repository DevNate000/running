-- To Do: Create ability to have friends

DROP TABLE runs;
DROP TABLE users;


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

INSERT INTO users (first_name, last_name, password, age, gender, location, profile_picture, creation_date, last_login)
VALUES
  ('Nate', 'Stubbs', 'nate123!', 19, 'Male', 'NSB', 'nate_stubbs.jpg', '2025-09-20 10:20:10', '2025-09-23 10:20:10'),
  ('Ben', 'Zobrist', 'ben123!', 44, 'Male', 'MPS', 'ben_zobrist.png', '2025-09-22 10:20:10', '2025-09-25 10:20:10');


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

INSERT INTO runs (user_id, miles, start_time, end_time, start_location, end_location, weather_id, is_legit)
VALUES
    (1, 3.16, '2025-09-20 10:20:02', '2025-09-20 10:50:10', 'NSB', 'NSB', 1, 1),
    (1, 14.16, '2025-09-21 14:08:50', '2025-09-21 16:43:04', 'DTB', 'DTB', 1, 1);

SELECT * FROM users;
SELECT * FROM runs;
SELECT
    first_name || ' ' || last_name AS Name,
    miles,
    start_time,
    end_time,
    printf('%02d:%02d:%02d',
        (strftime('%s', end_time) - strftime('%s', start_time)) / 3600,
        ((strftime('%s', end_time) - strftime('%s', start_time)) % 3600) / 60,
        (strftime('%s', end_time) - strftime('%s', start_time)) % 60
    ) AS time
FROM runs
LEFT JOIN users ON runs.user_id = users.id;
