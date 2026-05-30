try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    from psycopg2 import pool
except ImportError:
    psycopg2 = None
    RealDictCursor = None
    pool = None

from contextlib import contextmanager
from config import get_settings

settings = get_settings()

# Create PostgreSQL connection pool (optional - for future use)
connection_pool = None

if psycopg2:
    try:
        connection_pool = psycopg2.pool.SimpleConnectionPool(
            1, 20, settings.database_url  # min and max connections
        )
        print("✅ Database connection pool created")
    except Exception as e:
        print(f"⚠️  Database connection failed (optional): {e}")
else:
    print("⚠️  psycopg2 not installed. Database features disabled.")


@contextmanager
def get_db():
    """Get database connection from pool"""
    if not connection_pool:
        raise Exception("Database connection pool not initialized")

    conn = connection_pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        connection_pool.putconn(conn)


def get_db_cursor():
    """Dependency for FastAPI endpoints - returns cursor"""
    if not connection_pool:
        raise Exception("Database connection pool not initialized")

    conn = connection_pool.getconn()
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        yield cursor
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cursor.close()
        connection_pool.putconn(conn)


def init_db():
    """Initialize database tables (optional - not needed for AI service only)"""
    if not connection_pool:
        print("⚠️  Database not configured - skipping table creation")
        return

    print("✅ Database initialized (no tables needed for AI service)")
    # AI Service doesn't need database tables
    # Only CLOVA Voice API calls
