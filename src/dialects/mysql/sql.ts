import { TSchemaColumn } from '../../schema/schema-types';
import { TClientSql } from '../../types';

const sql: TClientSql = {
    dialect: 'mysql',
    q: (value: string) => `\`${value}\``,
    renderColumnType: (column: TSchemaColumn) => {
        const columnType = column.type;
        switch (columnType) {
            case 'boolean': return 'TINYINT(1) CHECK (value IN (0,1))';
            case 'date': return 'DATE';
            case 'datetime': return 'DATETIME';
            case 'enum': return `ENUM(${getEnumValues(column.values)})`;
            case 'integer': return 'INT' + (column.auto ? ' AUTO_INCREMENT' : '');
            case 'string': return `VARCHAR(${column.size ?? 255})`;
            case 'text': return getTextColumnType(column);
            case 'time': return 'TIME';
            case 'uuid': return 'CHAR(36)';
        }

        throw new Error(`Unknown column type: ${columnType}`);
    },
};

export default sql;

function getTextColumnType (column: TSchemaColumn & { type: 'text' }) {
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

function getEnumValues (values: string[]) {
    return values.map(value => `'${value}'`).join(',');
}
