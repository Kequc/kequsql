import { TScheme } from '@/types';
import { TSchemaColumn } from './schema-types';

export default function renderColumnType (scheme: TScheme, column: TSchemaColumn) {
    switch (scheme) {
        case 'mysql': return renderMysqlColumnType(column) + (column.nullable ? '' : ' NOT NULL');
        case 'postgres': return renderPostgresColumnType(column) + (column.nullable ? '' : ' NOT NULL');
    }

    throw new Error(`Unknown scheme: ${scheme}`);
}

function renderMysqlColumnType (column: TSchemaColumn) {
    const columnType = column.type;
    switch (columnType) {
        case 'boolean': return 'TINYINT(1) CHECK (value IN (0,1))';
        case 'date': return 'DATE';
        case 'datetime': return 'DATETIME';
        case 'enum': return `ENUM(${getEnumValues(column.values)})`;
        case 'integer': return 'INT' + (column.auto ? ' AUTO_INCREMENT' : '');
        case 'string': return `VARCHAR(${column.size ?? 255})`;
        case 'text': return getMysqlTextColumnType(column);
        case 'time': return 'TIME';
        case 'uuid': return 'CHAR(36)';
    }

    throw new Error(`Unknown column type: ${columnType}`);
}

function getMysqlTextColumnType (column: TSchemaColumn & { type: 'text' }) {
    if (column.size === 'medium') {
        return 'MEDIUMTEXT';
    } else if (column.size === 'long') {
        return 'LONGTEXT';
    } else if (typeof column.size === 'number') {
        return `TEXT(${column.size})`;
    } else {
        return 'TEXT';
    }
}

function renderPostgresColumnType (column: TSchemaColumn) {
    const columnType = column.type;
    switch (columnType) {
        case 'boolean': return 'BOOLEAN';
        case 'date': return 'DATE';
        case 'datetime': return 'TIMESTAMP';
        case 'enum': return getPostgresEnumColumnType(column);
        case 'integer': return column.auto ? 'SERIAL' : 'INTEGER';
        case 'string': return `VARCHAR(${column.size ?? 255})`;
        case 'text': return 'TEXT';
        case 'time': return 'TIME';
        case 'uuid': return 'UUID';
    }

    throw new Error(`Unknown column type: ${columnType}`);
}

// TODO: Consider using real enum types for postgres
// Requires a separate type definition
// `CREATE TYPE ${column.name}_enum AS ENUM (${values})`
// `${column.name} ${column.name}_enum`
function getPostgresEnumColumnType (column: TSchemaColumn & { type: 'enum' }) {
    const size = getEnumSize(column.values);
    const values = getEnumValues(column.values);

    return `VARCHAR(${size}) CHECK (${column.name} IN (${values}))`;
}

// TODO: add support for sqlserver?
function getSqlserverColumnType (column: TSchemaColumn) {
    const columnType = column.type;
    switch (columnType) {
        case 'boolean': return 'BIT';
        case 'date': return 'DATE';
        case 'datetime': return 'DATETIME';
        case 'enum': return `VARCHAR(${getEnumSize(column.values)})`;
        case 'integer': return 'INT' + (column.auto ? ' IDENTITY' : '');
        case 'string': return `VARCHAR(${column.size ?? 255})`;
        case 'text': return 'TEXT';
        case 'time': return 'TIME';
        case 'uuid': return 'UNIQUEIDENTIFIER';
    }

    throw new Error(`Unknown column type: ${columnType}`);
}

function getEnumSize (values: string[]) {
    return Math.max(...values.map(value => value.length));
}

function getEnumValues (values: string[]) {
    return values.map(value => `'${value}'`).join(',');
}
