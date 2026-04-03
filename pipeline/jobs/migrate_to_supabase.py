import sqlite3
import psycopg2
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

SQLITE_PATH = Path(__file__).resolve().parents[1] / "shop.db"

print("Connecting to:", os.environ.get("SUPABASE_DB_URL", "NOT FOUND"))
sqlite = sqlite3.connect(SQLITE_PATH)
supa = psycopg2.connect(os.environ["SUPABASE_DB_URL"])

sqlite_cur = sqlite.cursor()
supa_cur = supa.cursor()

def sqlite_type_to_pg(sqlite_type):
    t = sqlite_type.upper()
    if "INT" in t:
        return "BIGINT"
    if "REAL" in t or "FLOAT" in t or "DOUBLE" in t:
        return "DOUBLE PRECISION"
    if "TEXT" in t or "CHAR" in t or "CLOB" in t:
        return "TEXT"
    if "BLOB" in t or t == "":
        return "TEXT"
    if "BOOL" in t:
        return "BOOLEAN"
    if "DATE" in t or "TIME" in t:
        return "TEXT"
    return "TEXT"

sqlite_cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in sqlite_cur.fetchall()]

for table in tables:
    sqlite_cur.execute(f"PRAGMA table_info({table})")
    cols_info = sqlite_cur.fetchall()

    col_defs = []
    for col in cols_info:
        cid, name, col_type, notnull, default, pk = col
        pg_type = sqlite_type_to_pg(col_type)
        col_def = f'"{name}" {pg_type}'
        if pk == 1:
            col_def += " PRIMARY KEY"
        col_defs.append(col_def)

    create_sql = f'CREATE TABLE IF NOT EXISTS "{table}" ({", ".join(col_defs)})'
    print(f"Creating table: {table}")
    supa_cur.execute(create_sql)

supa.commit()

for table in tables:
    sqlite_cur.execute(f'SELECT * FROM "{table}"')
    rows = sqlite_cur.fetchall()
    cols = [d[0] for d in sqlite_cur.description]

    placeholders = ",".join(["%s"] * len(cols))
    col_names = ",".join([f'"{c}"' for c in cols])
    supa_cur.executemany(
        f'INSERT INTO "{table}" ({col_names}) VALUES ({placeholders}) ON CONFLICT DO NOTHING',
        rows
    )
    print(f"Migrated {table}: {len(rows)} rows")

supa.commit()
sqlite.close()
supa.close()
print("Done.")
