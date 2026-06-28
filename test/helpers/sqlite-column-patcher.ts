import { getMetadataArgsStorage } from 'typeorm';

/**
 * SQLite Column Patcher
 * ---------------------
 * SQLite does not support Postgres-specific column types:
 *   - enum     → stored as varchar/text in Postgres; must be 'text' in SQLite
 *   - decimal  → stored with precision/scale in Postgres; must be 'numeric' in SQLite
 *   - timestamptz → Postgres-only; must be 'datetime' in SQLite
 *
 * This function patches TypeORM's metadata storage BEFORE the DataSource
 * initialises, so the same entity classes work with both Postgres (production)
 * and SQLite (tests) without duplicating entity files.
 */
export function patchEntitiesForSqlite(): void {
  const storage = getMetadataArgsStorage();

  for (const col of storage.columns) {
    const options = col.options as any;

    if (!options) continue;

    // enum → text  (SQLite has no enum type; values are validated by the app layer)
    if (options.type === 'enum') {
      options.type = 'text';
      delete options.enum;
    }

    // decimal → numeric  (SQLite stores all numbers as REAL/NUMERIC)
    if (options.type === 'decimal') {
      options.type = 'numeric';
      delete options.precision;
      delete options.scale;
    }

    // timestamptz /timestamp→ datetime  (Postgres-specific; SQLite uses datetime)
    if (options.type === 'timestamptz' || options.type === 'timestamp') {
      options.type = 'datetime';
    }
  }
}
