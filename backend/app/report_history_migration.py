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
    if not column_exists(connection, "report_history", column_name):
        connection.execute(
            text(
                f"ALTER TABLE report_history "
                f"ADD COLUMN {column_name} {definition}"
            )
        )
        print(f"Added column: {column_name}")
    else:
        print(f"Column already exists: {column_name}")


def migrate():
    with engine.begin() as connection:

        print("Starting Report History migration...\n")

        # ---------------------------------------------------------
        # Task 15 columns
        # ---------------------------------------------------------

        add_column(
            connection,
            "applied_filters",
            "TEXT NOT NULL DEFAULT '{}'",
        )

        add_column(
            connection,
            "report_period",
            "VARCHAR(100)",
        )

        add_column(
            connection,
            "export_format",
            "VARCHAR(20) NOT NULL DEFAULT 'VIEW'",
        )

        add_column(
            connection,
            "status",
            "VARCHAR(30) NOT NULL DEFAULT 'SUCCESS'",
        )

        add_column(
            connection,
            "failure_reason",
            "TEXT",
        )

        add_column(
            connection,
            "file_path",
            "VARCHAR(500)",
        )

        add_column(
            connection,
            "row_count",
            "INTEGER NOT NULL DEFAULT 0",
        )

        # ---------------------------------------------------------
        # Legacy "format" column
        # ---------------------------------------------------------

        if column_exists(connection, "report_history", "format"):

            connection.execute(
                text("""
                    ALTER TABLE report_history
                    ALTER COLUMN format SET DEFAULT 'VIEW'
                """)
            )

            connection.execute(
                text("""
                    UPDATE report_history
                    SET format = 'VIEW'
                    WHERE format IS NULL
                """)
            )

            print("Updated legacy 'format' column compatibility.")

        else:
            print("Legacy 'format' column not found.")

        # ---------------------------------------------------------
        # Existing "generated_at" column compatibility
        # ---------------------------------------------------------

        if column_exists(connection, "report_history", "generated_at"):

            # Set current timestamp for any existing NULL rows.
            connection.execute(
                text("""
                    UPDATE report_history
                    SET generated_at = CURRENT_TIMESTAMP
                    WHERE generated_at IS NULL
                """)
            )

            # Make sure future inserts automatically get a timestamp.
            connection.execute(
                text("""
                    ALTER TABLE report_history
                    ALTER COLUMN generated_at
                    SET DEFAULT CURRENT_TIMESTAMP
                """)
            )

            print("Updated 'generated_at' column compatibility.")

        else:
            print("'generated_at' column not found.")

    print("\nReport History migration completed successfully.")


if __name__ == "__main__":
    migrate()