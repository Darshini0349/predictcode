# database.py
import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'lifeguard.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS predictions (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            name            TEXT,
            age             INTEGER,
            gender          TEXT,
            stage           INTEGER,
            diabetes_score  INTEGER,
            diabetes_risk   TEXT,
            heart_score     INTEGER,
            heart_risk      TEXT,
            bp_score        INTEGER,
            bp_risk         TEXT,
            advice          TEXT,
            created_at      TEXT
        )
    ''')

    conn.commit()
    conn.close()

def save_prediction(data, results, advice):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('''
        INSERT INTO predictions (
            name, age, gender, stage,
            diabetes_score, diabetes_risk,
            heart_score, heart_risk,
            bp_score, bp_risk,
            advice, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data.get('name', 'Anonymous'),
        data.get('age'),
        data.get('gender'),
        data.get('stage', 1),
        results['diabetes']['total_score'],
        results['diabetes']['risk'],
        results['heart']['total_score'],
        results['heart']['risk'],
        results['bp']['total_score'],
        results['bp']['risk'],
        advice,
        datetime.now().strftime('%d %B %Y %I:%M %p')
    ))

    conn.commit()
    prediction_id = cursor.lastrowid
    conn.close()
    return prediction_id

def get_all_predictions():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM predictions ORDER BY created_at DESC')
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_prediction_by_id(prediction_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM predictions WHERE id = ?', (prediction_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def delete_prediction(prediction_id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM predictions WHERE id = ?', (prediction_id,))
    conn.commit()
    conn.close()


def delete_all_predictions():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM predictions')
    conn.commit()
    conn.close()