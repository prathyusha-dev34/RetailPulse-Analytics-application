from sqlalchemy import text
from app.core.database import engine


def column_exists(connection, table_name, column_name):
    result = connection.execute(
        text("""
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = :table_name
                  AND column_name = :column_name
            )
        """),
        {
            "table_name": table_name,
            "column_name": column_name,
        },
    )
    return result.scalar()


def add_column(connection, column_name, definition):
    if not column_exists(connection, "scheduled_reports", column_name):
        connection.execute(
            text(
                f"ALTER TABLE scheduled_reports "
                f"ADD COLUMN {column_name} {definition}"
            )
        )
        print(f"Added column: {column_name}")
    else:
        print(f"Column already exists: {column_name}")


def migrate():
    with engine.begin() as connection:
        print("Starting Scheduled Reports migration...\n")

        # New Task 15 columns
        add_column(
            connection,
            "filters_json",
            "TEXT NOT NULL DEFAULT '{}'"
        )

        add_column(
            connection,
            "recipients_json",
            "TEXT NOT NULL DEFAULT '[]'"
        )

        add_column(
            connection,
            "export_format",
            "VARCHAR(10) NOT NULL DEFAULT 'CSV'"
        )

        add_column(
            connection,
            "is_active",
            "BOOLEAN NOT NULL DEFAULT TRUE"
        )

        add_column(
            connection,
            "last_run_at",
            "TIMESTAMP WITH TIME ZONE"
        )

        add_column(
            connection,
            "last_report_history_id",
            "INTEGER"
        )

        add_column(
            connection,
            "last_status",
            "VARCHAR(30)"
        )

        add_column(
            connection,
            "last_error",
            "TEXT"
        )

        add_column(
            connection,
            "next_run_at",
            "TIMESTAMP WITH TIME ZONE"
        )

        add_column(
            connection,
            "created_at",
            "TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP"
        )

        add_column(
            connection,
            "updated_at",
            "TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP"
        )

        # Preserve existing legacy filter data
        if column_exists(connection, "scheduled_reports", "filters"):
            connection.execute(
                text("""
                    UPDATE scheduled_reports
                    SET filters_json = filters
                    WHERE filters IS NOT NULL
                      AND filters <> ''
                """)
            )
            print("Migrated legacy 'filters' data to 'filters_json'.")

        # Preserve existing legacy recipient data
        if column_exists(connection, "scheduled_reports", "recipients"):
            connection.execute(
                text("""
                    UPDATE scheduled_reports
                    SET recipients_json = recipients
                    WHERE recipients IS NOT NULL
                      AND recipients <> ''
                """)
            )
            print("Migrated legacy 'recipients' data to 'recipients_json'.")

        # Ensure timestamps exist for existing rows
        connection.execute(
            text("""
                UPDATE scheduled_reports
                SET created_at = CURRENT_TIMESTAMP
                WHERE created_at IS NULL
            """)
        )

        connection.execute(
            text("""
                UPDATE scheduled_reports
                SET updated_at = CURRENT_TIMESTAMP
                WHERE updated_at IS NULL
            """)
        )

        print("\nScheduled Reports migration completed successfully.")


if __name__ == "__main__":
    migrate()