import { TSchemaColumn, TSchemaIndex, TSchemaTable } from '../index';

export default function validateSchema (tables: TSchemaTable[]): void {
    for (const table of tables) {
        let primary: TSchemaIndex | undefined = undefined;
        let increment: TSchemaColumn | undefined = undefined;
        const uniques: TSchemaIndex[] = table.indexes.filter(index => index.type === 'UNIQUE');

        for (const index of table.indexes) {
            if (index.columns.length === 0) {
                throw new Error(`Index must have at least one column on table ${table.name}`);
            }

            if (index.columns.some(column => table.columns.every(col => col.name !== column))) {
                throw new Error(`Index (${index.columns.join(', ')}) does not exist on table ${table.name}`);
            }

            if (index.type === 'PRIMARY KEY') {
                if (primary) throw new Error(`Multiple primary keys defined on table ${table.name}`);
                primary = index;
            }
        }

        for (const column of table.columns) {
            if (column.increment) {
                if (increment) throw new Error(`Multiple increment columns defined on table ${table.name}`);
                increment = column;

                if (!table.indexes.some(index => index.columns[0] === column.name)) {
                    throw new Error(`Increment column must be a primary key or an index on table ${table.name}`);
                }
            }

            if (column.nullable && primary?.columns.includes(column.name)) {
                throw new Error(`Primary key column cannot be nullable on table ${table.name}`);
            }
        }

        for (const foreignKey of table.foreignKeys) {
            if (foreignKey.columns.length === 0) throw new Error(`Foreign key must have at least one column on table ${table.name}`);
            if (foreignKey.ids.length === 0) throw new Error(`Foreign key must have at least one id on table ${table.name}`);

            if (foreignKey.columns.length !== foreignKey.ids.length) {
                throw new Error(`Foreign key columns and ids must have the same length on table ${table.name}`);
            }

            if (foreignKey.columns.some(column => table.columns.every(col => col.name !== column))) {
                throw new Error(`Foreign key (${foreignKey.columns.join(', ')}) does not exist on table ${table.name}`);
            }
        }

        if (!primary && !increment && uniques.length < 1) throw new Error(`Unique index, increment, or primary key must exist on table ${table.name}`);
    }
}
