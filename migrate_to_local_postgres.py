import os
import sys
import json
import psycopg2
from psycopg2 import sql
from psycopg2.extras import Json
from dotenv import load_dotenv

load_dotenv('backend/.env')

NEON_URL = os.getenv('DATABASE_URL')
LOCAL_HOST = "localhost"
LOCAL_PORT = 5432
LOCAL_USER = "postgres"
LOCAL_PASS = "Manohar"
LOCAL_DB = "hotel"

def step1_create_hotel_db():
    print(f"Step 1: Checking/Creating database '{LOCAL_DB}' on local Postgres...")
    conn = psycopg2.connect(
        host=LOCAL_HOST,
        port=LOCAL_PORT,
        user=LOCAL_USER,
        password=LOCAL_PASS,
        dbname="postgres"
    )
    conn.autocommit = True
    cur = conn.cursor()
    
    cur.execute("SELECT 1 FROM pg_database WHERE datname = %s;", (LOCAL_DB,))
    exists = cur.fetchone()
    if not exists:
        cur.execute(sql.SQL("CREATE DATABASE {};").format(sql.Identifier(LOCAL_DB)))
        print(f"  --> Database '{LOCAL_DB}' created successfully!")
    else:
        print(f"  --> Database '{LOCAL_DB}' already exists.")
    
    cur.close()
    conn.close()

def step2_create_tables():
    print(f"Step 2: Creating tables in local database '{LOCAL_DB}' via SQLAlchemy models...")
    sys.path.insert(0, os.path.abspath("backend"))
    from database import Base
    from sqlalchemy import create_engine
    import models

    local_url = f"postgresql://{LOCAL_USER}:{LOCAL_PASS}@{LOCAL_HOST}:{LOCAL_PORT}/{LOCAL_DB}"
    local_engine = create_engine(local_url)
    models.Base.metadata.create_all(bind=local_engine)
    print("  --> Tables created / verified successfully!")
    return local_url

def step3_migrate_data(local_url):
    print(f"Step 3: Migrating all data from Neon to local Postgres '{LOCAL_DB}'...")
    neon_conn = psycopg2.connect(NEON_URL)
    neon_cur = neon_conn.cursor()

    local_conn = psycopg2.connect(local_url)
    local_conn.autocommit = False
    local_cur = local_conn.cursor()

    # Tables in dependency order
    table_order = [
        "users",
        "hotels",
        "rooms",
        "wallets",
        "wallet_transactions",
        "leads",
        "lead_unlocks",
        "quotes",
        "bookings",
        "messages",
        "reviews"
    ]

    for table in table_order:
        # Check source columns
        neon_cur.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table}' ORDER BY ordinal_position;")
        col_meta = neon_cur.fetchall()
        if not col_meta:
            print(f"  [!] Table {table} does not exist in source, skipping.")
            continue
        
        col_names = [c[0] for c in col_meta]
        col_types = {c[0]: c[1] for c in col_meta}
        cols_str = ", ".join(col_names)
        placeholders = ", ".join(["%s"] * len(col_names))

        neon_cur.execute(f"SELECT {cols_str} FROM {table};")
        rows = neon_cur.fetchall()

        # Clear existing rows in local table before copying to prevent duplicates
        local_cur.execute(f"DELETE FROM {table};")

        inserted = 0
        for row in rows:
            # Convert dicts/lists to Json objects if needed
            converted_row = []
            for val, col_name in zip(row, col_names):
                if isinstance(val, (dict, list)):
                    converted_row.append(Json(val))
                else:
                    converted_row.append(val)
            
            insert_query = f"INSERT INTO {table} ({cols_str}) VALUES ({placeholders});"
            local_cur.execute(insert_query, converted_row)
            inserted += 1

        print(f"  --> {table}: Migrated {inserted} rows.")

        # Update sequence for primary key 'id'
        try:
            local_cur.execute(f"""
                SELECT setval(pg_get_serial_sequence('{table}', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL)
                FROM {table};
            """)
        except Exception as e:
            # Table might not have a serial sequence
            pass

    local_conn.commit()
    local_cur.close()
    local_conn.close()
    neon_cur.close()
    neon_conn.close()
    print("  --> All tables migrated and committed successfully!")

def step4_verify():
    print(f"\nStep 4: Verifying data counts in local database '{LOCAL_DB}'...")
    local_url = f"postgresql://{LOCAL_USER}:{LOCAL_PASS}@{LOCAL_HOST}:{LOCAL_PORT}/{LOCAL_DB}"
    conn = psycopg2.connect(local_url)
    cur = conn.cursor()
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
    tables = [r[0] for r in cur.fetchall()]
    for t in sorted(tables):
        cur.execute(f"SELECT count(*) FROM {t};")
        count = cur.fetchone()[0]
        print(f"  {t:20}: {count} rows")
    cur.close()
    conn.close()

if __name__ == "__main__":
    step1_create_hotel_db()
    local_url = step2_create_tables()
    step3_migrate_data(local_url)
    step4_verify()
    print("\nMigration completed successfully!")
