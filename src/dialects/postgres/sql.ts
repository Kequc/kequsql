import { TSchemaColumn, TSchemaTable } from '../../schema/types';
import { TClientSql } from '../../types';
import { dateToSql } from '../../util/helpers';

const sql: TClientSql = {
    dialect: 'postgres',
    q: (value: string) => `"${value}"`,
    renderColumnType: (table: TSchemaTable, column: TSchemaColumn) => {
        return [
            getColumnType(column),
            getColumnNull(column),
            getColumnDefault(table, column),
        ].filter(Boolean).join(' ');
    },
};

export default sql;

function getColumnType (column: TSchemaColumn) {
    const columnType = column.type;
    switch (columnType) {
        case 'boolean': return 'boolean';
        case 'date': return 'date';
        case 'datetime': return 'timestamp';
        case 'enum': return getEnumColumnType(column);
        case 'integer': return column.auto ? 'serial' : 'integer';
        case 'string': return `varchar(${column.size ?? 255})`;
        case 'text': return 'text';
        case 'time': return 'time';
        case 'uuid': return 'uuid';
    }

    throw new Error(`Unknown column type: ${columnType}`);
}

function getColumnNull (column: TSchemaColumn) {
    if (column.type === 'integer' && column.auto) return 'NOT NULL';
    return column.nullable === true ? '' : 'NOT NULL';
}

function getColumnDefault (table: TSchemaTable, column: TSchemaColumn) {
    if (column.default === null || column.default === undefined || typeof column.default === 'function') return '';

    if (column.type === 'integer' && column.auto) {
        return '';
    } else if (typeof column.default === 'number') {
        return `DEFAULT ${column.default}`;
    } else if (typeof column.default === 'boolean') {
        return `DEFAULT ${column.default ? 'TRUE' : 'FALSE'}`;
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
    const size = getEnumSize(column.values);
    const values = getEnumValues(column.values);
    return `varchar(${size}) CHECK (${sql.q(column.name)} IN (${values}))`;
}

function getEnumSize (values: string[]) {
    return Math.max(...values.map(value => value.length));
}

function getEnumValues (values: string[]) {
    return values.map(value => `'${value}'`).join(',');
}
