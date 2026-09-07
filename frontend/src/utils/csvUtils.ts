
export interface CsvPreviewResult {
  columns: string[];
  rows: Record<string, string>[];
}

/**
 * Parse CSV file and return normalized column names
 * and first 10 rows for preview.
 */
export function parseCsvPreview(
  file: File
): Promise<CsvPreviewResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const text = String(
          reader.result || ""
        ).replace(/^\uFEFF/, "");

        const records: string[][] = [];
        let row: string[] = [];
        let cell = "";
        let quoted = false;

        for (
          let i = 0;
          i < text.length;
          i += 1
        ) {
          const ch = text[i];

          // Handle quoted values and escaped quotes.
          if (ch === '"') {
            if (
              quoted &&
              text[i + 1] === '"'
            ) {
              cell += '"';
              i += 1;
            } else {
              quoted = !quoted;
            }

            continue;
          }

          // Comma outside quotes = next column.
          if (
            ch === "," &&
            !quoted
          ) {
            row.push(cell);
            cell = "";
            continue;
          }

          // New line outside quotes = next row.
          if (
            (ch === "\n" ||
              ch === "\r") &&
            !quoted
          ) {
            if (
              ch === "\r" &&
              text[i + 1] === "\n"
            ) {
              i += 1;
            }

            row.push(cell);
            cell = "";

            if (
              row.some(
                (value) =>
                  value.trim() !== ""
              )
            ) {
              records.push(row);
            }

            row = [];
            continue;
          }

          cell += ch;
        }

        // Handle final row when CSV doesn't
        // end with a newline.
        if (
          cell !== "" ||
          row.length > 0
        ) {
          row.push(cell);

          if (
            row.some(
              (value) =>
                value.trim() !== ""
            )
          ) {
            records.push(row);
          }
        }

        if (records.length === 0) {
          resolve({
            columns: [],
            rows: [],
          });
          return;
        }

        const rawColumns =
          records.shift() || [];

        const columns =
          rawColumns.map((value) =>
            value.trim()
          );

        const normalizedColumns =
          columns.map(
            normalizeCsvColumn
          );

        const preview =
          records
            .slice(0, 10)
            .map((values) => {
              const result: Record<
                string,
                string
              > = {};

              normalizedColumns.forEach(
                (
                  column,
                  index
                ) => {
                  result[column] = (
                    values[index] || ""
                  ).trim();
                }
              );

              return result;
            });

        resolve({
          columns:
            normalizedColumns,
          rows: preview,
        });
      } catch {
        reject(
          new Error(
            "Unable to read the CSV file."
          )
        );
      }
    };

    reader.onerror = () => {
      reject(
        new Error(
          "Unable to read the selected file."
        )
      );
    };

    reader.readAsText(file);
  });
}

/**
 * Normalize CSV column names so frontend
 * validation is case-insensitive.
 *
 * Example:
 * " Product   Name "
 * -> "product name"
 */
export function normalizeCsvColumn(
  value: string
): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * Check whether a CSV contains all
 * required columns.
 */
export function getMissingColumns(
  columns: string[],
  requiredColumns: string[]
): string[] {
  const normalizedColumns =
    columns.map(
      normalizeCsvColumn
    );

  return requiredColumns
    .map(
      normalizeCsvColumn
    )
    .filter(
      (column) =>
        !normalizedColumns.includes(
          column
        )
    );
}

