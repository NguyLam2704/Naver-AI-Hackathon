# Database Module

Module for PostgreSQL database connections and models.

## Files:

- `__init__.py` - Export public interfaces
- `connection.py` - Database connection pool and helper functions
- `models.py` - Database models (currently empty - AI service only)

## Usage:

```python
from database import get_db, init_db

# Initialize database
init_db()

# Get connection
with get_db() as conn:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM table")
    results = cursor.fetchall()
```

## Note:

Database is optional for AI Voice Service.
Currently only used for future extensions.
