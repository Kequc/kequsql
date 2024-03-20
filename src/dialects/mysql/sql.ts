import { TSchemaColumn, TSchemaTable } from '../../schema/types';
import { TClientSql } from '../../types';
import { dateToSql } from '../../util/helpers';

const sql: TClientSql = {
    dialect: 'mysql',
    q: (value: string) => `\`${value}\``,
    renderColumnType: (table: TSchemaTable, column: TSchemaColumn) => {
        return [
            getColumnType(column),
            getColumnNull(column),
            getColumnDefault(column),
        ].filter(Boolean).join(' ');
    },
};

export default sql;

function getColumnType (column: TSchemaColumn) {
    const columnType = column.type;
    switch (columnType) {
        case 'boolean': return 'tinyint(1) CHECK (value IN (0,1))';
        case 'date': return 'date';
        case 'datetime': return 'datetime';
        case 'enum': return getEnumColumnType(column);
        case 'integer': return getIntegerColumnType(column);
        case 'string': return `varchar(${column.size ?? 255})`;
        case 'text': return getTextColumnType(column);
        case 'time': return 'time';
        case 'uuid': return 'char(36)';
    }

    throw new Error(`Unknown column type: ${columnType}`);
}

function getColumnNull (column: TSchemaColumn) {
    if (column.type === 'integer' && column.auto) return 'NOT NULL';
    return column.nullable === true ? '' : 'NOT NULL';
}

function getColumnDefault (column: TSchemaColumn) {
    if (column.default === null || column.default === undefined || typeof column.default === 'function') return '';

    if (typeof column.default === 'number') {
        return `DEFAULT ${column.default}`;
    } else if (typeof column.default === 'boolean') {
        return `DEFAULT ${column.default ? 1 : 0}`;
    } else if (column.default instanceof Date) {
        const parts = dateToSql(column.default);
        if (column.type === 'date') return `DEFAULT '${parts[0]}'`;
        if (column.type === 'time') return `DEFAULT '${parts[1]}'`;
        return `DEFAULT '${parts.join(' ')}'`;
    } else {
        return `DEFAULT '${column.default}'`;
    }
}

function getEnumColumnType (column: TSchemaColumn & { type: 'enum' }) {
    const values = column.values.map(value => `'${value}'`).join(',');
    return `enum(${values})`;
}

function getIntegerColumnType (column: TSchemaColumn & { type: 'integer' }) {
    return [
        'INT',
        column.unsigned || column.auto ? 'unsigned' : '',
        column.auto ? 'auto_increment' : '',
    ].filter(Boolean).join(' ');
}

function getTextColumnType (column: TSchemaColumn & { type: 'text' }) {
    if (column.size === 'medium') {
        return 'mediumtext';
    } else if (column.size === 'long') {
        return 'longtext';
    } else if (typeof column.size === 'number') {
        return `text(${column.size})`;
    } else {
        return 'text';
    }
}
