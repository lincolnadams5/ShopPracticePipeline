# jobs/run_inference.py
import sqlite3
from datetime import datetime

import joblib
import pandas as pd

from config import OP_DB_PATH, MODEL_PATH
from utils_db import sqlite_conn, ensure_predictions_table
from etl_build_warehouse import SELECTED_FEATURES

def run_inference():
    model = joblib.load(str(MODEL_PATH))

    with sqlite_conn(OP_DB_PATH) as conn:
        df = pd.read_sql("""
            SELECT
                o.order_id,
                o.order_subtotal,
                o.order_total,
                o.tax_amount,
                o.shipping_state,
                o.ip_country,
                c.customer_id,
                c.birthdate,
                c.created_at,
                COALESCE(r.avg_rating, NULL) AS customer_avg_rating,
                oi.max_unit_price
            FROM orders o
            JOIN customers c ON o.customer_id = c.customer_id
            LEFT JOIN (
                SELECT customer_id, AVG(rating) AS avg_rating
                FROM product_reviews
                GROUP BY customer_id
            ) r ON r.customer_id = c.customer_id
            LEFT JOIN (
                SELECT order_id, MAX(unit_price) AS max_unit_price
                FROM order_items
                GROUP BY order_id
            ) oi ON oi.order_id = o.order_id
        """, conn)

        df['customer_tenure_days'] = (pd.to_datetime('today') - pd.to_datetime(df['created_at'])).dt.days
        df['customer_age'] = (pd.to_datetime('today') - pd.to_datetime(df['birthdate'])).dt.days // 365

        df['predicted_risk_score'] = model.predict(df[SELECTED_FEATURES])

        timestamp = datetime.utcnow().isoformat()
        ensure_predictions_table(conn)

        rows = [
            (int(row.order_id), float(row.predicted_risk_score), timestamp)
            for row in df.itertuples()
        ]

        conn.execute("DELETE FROM order_predictions_risk")
        conn.executemany("""
            INSERT INTO order_predictions_risk (order_id, predicted_risk_score, prediction_timestamp)
            VALUES (?, ?, ?)
        """, rows)
        conn.commit()

    print(f"Predictions written: {len(rows)}")

if __name__ == "__main__":
    run_inference()
