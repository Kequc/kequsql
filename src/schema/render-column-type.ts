import { TSchemaColumn, TScheme } from '../types';

export enum COLUMN_TYPE {
    BOOLEAN,
    DATE,
    DATETIME,
    TIME,
    ENUM,
    INTEGER,
    STRING,
    TEXT,
    UUID
};

export default function renderColumnType (scheme: TScheme, column: TSchemaColumn) {
    switch (scheme) {
        case 'mysql': return renderMysqkColumnType(column);
        case 'postgres': return renderPostgresColumnType(column);
    }

    throw new Error(`Unknown scheme: ${scheme}`);
}

function renderMysqkColumnType (column: TSchemaColumn) {
    switch (column.type) {
        case COLUMN_TYPE.BOOLEAN: return 'TINYINT(1) CHECK (value IN (0,1))';
        case COLUMN_TYPE.DATE: return 'DATE(3)';
        case COLUMN_TYPE.DATETIME: return 'DATETIME';
        case COLUMN_TYPE.ENUM: return `ENUM(${column.errata})`;
        case COLUMN_TYPE.INTEGER: return 'INT';
        case COLUMN_TYPE.STRING: return `VARCHAR(${column.size})`;
        case COLUMN_TYPE.TEXT: return getMysqlTextColumnType(column);
        case COLUMN_TYPE.TIME: return 'TIME';
        case COLUMN_TYPE.UUID: return 'CHAR(36)';
    }

    throw new Error(`Unknown column type: ${column.type}`);
}

function getMysqlTextColumnType (column: TSchemaColumn) {
    if (column.errata === 'medium') {
        return 'MEDIUMTEXT';
    } else if (column.errata === 'long') {
        return 'LONGTEXT';
    } else if (typeof column.size === 'number') {
        return `TEXT(${column.size})`;
    } else {
        return 'TEXT';
    }
}

function renderPostgresColumnType (column: TSchemaColumn) {
    switch (column.type) {
        case COLUMN_TYPE.BOOLEAN: return 'BOOLEAN';
        case COLUMN_TYPE.DATE: return 'DATE';
        case COLUMN_TYPE.DATETIME: return 'TIMESTAMP';
        case COLUMN_TYPE.ENUM: return `VARCHAR(${column.size}) CHECK (${column.name} IN (${column.errata}))`;
        case COLUMN_TYPE.INTEGER: return column.increment ? 'SERIAL' : 'INTEGER';
        case COLUMN_TYPE.STRING: return `VARCHAR(${column.size})`;
        case COLUMN_TYPE.TEXT: return 'TEXT';
        case COLUMN_TYPE.TIME: return 'TIME';
        case COLUMN_TYPE.UUID: return 'UUID';
    }

    throw new Error(`Unknown column type: ${column.type}`);
}
