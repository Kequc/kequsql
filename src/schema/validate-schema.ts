import { TSchemaColumn, TSchemaIndex, TSchemaTable } from './schema-types';
import { getColumns, getIds } from './schema-parser';

export default function validateSchema (tables: TSchemaTable[]): void {
    for (const table of tables) {
        let primary: TSchemaIndex | undefined = undefined;
        let increment: TSchemaColumn | undefined = undefined;
        const uniques: TSchemaIndex[] = table.indexes.filter(index => index.type === 'unique');

        for (const index of table.indexes) {
            const columns = getColumns(index.column);

            if (columns.length === 0) {
                throw new Error(`Index must have at least one column on table ${table.name}`);
            }

            if (columns.some(column => table.columns.every(col => col.name !== column))) {
                throw new Error(`Index (${columns.join(', ')}) does not exist on table ${table.name}`);
            }

            if (index.type === 'primary') {
                if (primary) throw new Error(`Multiple primary keys defined on table ${table.name}`);
                primary = index;
            }
        }

        for (const column of table.columns) {
            if (column.type === 'integer' && column.auto) {
                if (increment) throw new Error(`Multiple increment columns defined on table ${table.name}`);
                increment = column;

                if (!table.indexes.some(index => getColumns(index.column)[0] === column.name)) {
                    throw new Error(`Increment column must be a primary key or an index on table ${table.name}`);
                }
            }

            if (column.nullable && primary && getColumns(primary.column).includes(column.name)) {
                throw new Error(`Primary key column cannot be nullable on table ${table.name}`);
            }
        }

        for (const foreignKey of table.foreignKeys) {
            const columns = getColumns(foreignKey.column);
            const ids = getIds(foreignKey.id);

            if (!tables.some(table => table.name === foreignKey.table)) {
                throw new Error(`Foreign key references non-existent table ${foreignKey.table}`);
            }
            if (table.name === foreignKey.table) {
                throw new Error(`Foreign key references itself on table ${table.name}`);
            }

            if (columns.length === 0) throw new Error(`Foreign key must have at least one column on table ${table.name}`);
            if (ids.length === 0) throw new Error(`Foreign key must have at least one id on table ${table.name}`);

            if (columns.length !== ids.length) {
                throw new Error(`Foreign key columns and ids must have the same length on table ${table.name}`);
            }

            if (columns.some(column => table.columns.every(col => col.name !== column))) {
                throw new Error(`Foreign key (${columns.join(', ')}) does not exist on table ${table.name}`);
            }
        }

        if (!primary && !increment && uniques.length < 1) throw new Error(`Unique index, increment, or primary key must exist on table ${table.name}`);
    }
}
