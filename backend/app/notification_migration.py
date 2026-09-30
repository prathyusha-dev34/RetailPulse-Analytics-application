"""Task 14 PostgreSQL migration for notification fields.

Run from backend:
    python notification_migration.py
"""

from app.core.database import engine
from sqlalchemy import text


SQL = """
ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS priority VARCHAR(20) NOT NULL DEFAULT 'LOW',
    ADD COLUMN IF NOT EXISTS resource_type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS resource_id INTEGER,
    ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS ix_notifications_priority
    ON notifications(priority);

CREATE INDEX IF NOT EXISTS ix_notifications_is_read
    ON notifications(is_read);

CREATE INDEX IF NOT EXISTS ix_notifications_created_at
    ON notifications(created_at);

CREATE INDEX IF NOT EXISTS ix_notifications_expires_at
    ON notifications(expires_at);
"""


with engine.begin() as connection:
    for statement in SQL.split(";"):
        statement = statement.strip()
        if statement:
            connection.execute(text(statement))

print("Task 14 notification migration completed successfully.")
