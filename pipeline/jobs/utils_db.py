import sqlite3
import psycopg2
import os
from contextlib import contextmanager
from dotenv import load_dotenv

load_dotenv()

@contextmanager
def sqlite_conn(db_path):
    conn = sqlite3.connect(str(db_path))
    try:
        yield conn
    finally:
        conn.close()

@contextmanager
def supabase_conn():
    conn = psycopg2.connect(os.environ["SUPABASE_DB_URL"])
    try:
        yield conn
    finally:
        conn.close()

def ensure_predictions_table(conn):
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS order_predictions_risk (
      order_id INTEGER PRIMARY KEY,
      predicted_risk_score REAL,
      prediction_timestamp TEXT
    )
    """)
    conn.commit()
