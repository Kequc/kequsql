import { TSchemaColumn } from '../../schema/schema-types';
import { TClientSql } from '../../types';

const sql: TClientSql = {
    dialect: 'postgres',
    q: (value: string) => `"${value}"`,
    renderColumnType: (column: TSchemaColumn) => {
        const columnType = column.type;
        switch (columnType) {
            case 'boolean': return 'BOOLEAN';
            case 'date': return 'DATE';
            case 'datetime': return 'TIMESTAMP';
            case 'enum': return getEnumColumnType(column);
            case 'integer': return column.auto ? 'SERIAL' : 'INTEGER';
            case 'string': return `VARCHAR(${column.size ?? 255})`;
            case 'text': return 'TEXT';
            case 'time': return 'TIME';
            case 'uuid': return 'UUID';
        }

        throw new Error(`Unknown column type: ${columnType}`);
    },
};

export default sql;

// TODO: Consider using real enum types for postgres
// Requires a separate type definition
// `CREATE TYPE ${column.name}_enum AS ENUM (${values})`
// `${column.name} ${column.name}_enum`
function getEnumColumnType (column: TSchemaColumn & { type: 'enum' }) {
    const size = getEnumSize(column.values);
    const values = getEnumValues(column.values);
    return `VARCHAR(${size}) CHECK (${column.name} IN (${values}))`;
}

function getEnumSize (values: string[]) {
    return Math.max(...values.map(value => value.length));
}

function getEnumValues (values: string[]) {
    return values.map(value => `'${value}'`).join(',');
}
