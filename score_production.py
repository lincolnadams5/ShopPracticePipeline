"""
Production scoring script — reads orders from Supabase, runs the ML model,
and writes predictions back to Supabase. Triggered by GitHub Actions.
"""
import os
import sys
from pathlib import Path
from datetime import datetime

import joblib
import pandas as pd
import psycopg2
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

MODEL_PATH = Path(__file__).parent / "pipeline" / "risk_score_model.sav"

FEATURES = [
    "order_subtotal", "order_total", "tax_amount",
    "shipping_state", "ip_country",
    "customer_age", "customer_tenure_days",
    "customer_avg_rating", "max_unit_price",
]

def main():
    db_url = os.environ.get("SUPABASE_DB_URL")
    if not db_url:
        print("ERROR: SUPABASE_DB_URL is not set.")
        sys.exit(1)

    conn = psycopg2.connect(db_url)

    df = pd.read_sql("""
        SELECT
            o.order_id,
            o.order_subtotal,
            o.order_total,
            o.tax_amount,
            o.shipping_state,
            o.ip_country,
            c.birthdate,
            c.created_at,
            COALESCE(r.avg_rating, 3.0)  AS customer_avg_rating,
            COALESCE(oi.max_unit_price, 0) AS max_unit_price
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

    df["customer_tenure_days"] = (
        pd.to_datetime("today") - pd.to_datetime(df["created_at"])
    ).dt.days
    df["customer_age"] = (
        pd.to_datetime("today") - pd.to_datetime(df["birthdate"])
    ).dt.days // 365

    model = joblib.load(str(MODEL_PATH))
    df["predicted_risk_score"] = model.predict(df[FEATURES])

    timestamp = datetime.utcnow().isoformat()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS order_predictions_risk (
            order_id BIGINT PRIMARY KEY,
            predicted_risk_score DOUBLE PRECISION,
            prediction_timestamp TEXT
        )
    """)

    rows = [
        (int(row.order_id), float(row.predicted_risk_score), timestamp)
        for row in df.itertuples()
    ]

    cur.executemany("""
        INSERT INTO order_predictions_risk (order_id, predicted_risk_score, prediction_timestamp)
        VALUES (%s, %s, %s)
        ON CONFLICT (order_id) DO UPDATE SET
            predicted_risk_score = EXCLUDED.predicted_risk_score,
            prediction_timestamp = EXCLUDED.prediction_timestamp
    """, rows)

    conn.commit()
    conn.close()
    print(f"Done — scored {len(rows)} orders at {timestamp}")

if __name__ == "__main__":
    main()
