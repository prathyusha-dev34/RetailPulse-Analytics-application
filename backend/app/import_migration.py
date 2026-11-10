from sqlalchemy import text

from app.core.database import engine


def run_migration():

    print("Starting Task 17 Import History Migration...")

    columns = {
        "duplicate_records": "INTEGER NOT NULL DEFAULT 0",
        "skipped_records": "INTEGER NOT NULL DEFAULT 0",
        "processing_duration_seconds": "DOUBLE PRECISION NOT NULL DEFAULT 0",
        "started_at": "TIMESTAMP WITH TIME ZONE NULL",
        "completed_at": "TIMESTAMP WITH TIME ZONE NULL",
    }

    try:
        with engine.begin() as connection:

            database = connection.execute(
                text("SELECT current_database()")
            ).scalar()

            print("CONNECTED DATABASE:", database)

            table_exists = connection.execute(
                text("""
                    SELECT EXISTS (
                        SELECT 1
                        FROM information_schema.tables
                        WHERE table_schema = current_schema()
                        AND table_name = 'import_history'
                    )
                """)
            ).scalar()

            if not table_exists:
                raise Exception(
                    "import_history table does not exist. "
                    "Create the ImportHistory table first."
                )

            for column_name, column_type in columns.items():

                connection.execute(
                    text(f"""
                        ALTER TABLE import_history
                        ADD COLUMN IF NOT EXISTS
                        {column_name} {column_type}
                    """)
                )

                print(f"Verified column: {column_name}")

            print("\nTask 17 migration completed successfully!")

    except Exception as error:
        print("Migration failed:", str(error))
        raise


if __name__ == "__main__":
    run_migration()