# jobs/etl_build_warehouse.py
import sqlite3
import pandas as pd
from config import OP_DB_PATH

SELECTED_FEATURES = [
    'order_subtotal', 'order_total', 'tax_amount',
    'shipping_state', 'ip_country',
    'customer_age', 'customer_tenure_days', 'customer_avg_rating',
    'max_unit_price',
]

def build_modeling_df():
    conn = sqlite3.connect(str(OP_DB_PATH))

    orders = pd.read_sql('SELECT * FROM orders', conn)
    customers = pd.read_sql('SELECT * FROM customers', conn)
    order_items = pd.read_sql('SELECT order_id, unit_price FROM order_items', conn)
    reviews = pd.read_sql('SELECT customer_id, rating FROM product_reviews', conn)

    conn.close()

    items_agg = order_items.groupby('order_id').agg(
        max_unit_price=('unit_price', 'max'),
    ).reset_index()

    reviews_agg = reviews.groupby('customer_id').agg(
        customer_avg_rating=('rating', 'mean'),
    ).reset_index()

    df = orders.copy()
    df = df.merge(customers[['customer_id', 'birthdate', 'created_at']], on='customer_id', how='left')
    df = df.merge(items_agg, on='order_id', how='left')
    df = df.merge(reviews_agg, on='customer_id', how='left')

    df['customer_tenure_days'] = (pd.to_datetime('today') - pd.to_datetime(df['created_at'])).dt.days
    df['customer_age'] = (pd.to_datetime('today') - pd.to_datetime(df['birthdate'])).dt.days // 365

    return df[['order_id'] + SELECTED_FEATURES + ['risk_score']].copy()
