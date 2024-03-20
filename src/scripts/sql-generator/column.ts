import { TClientSql } from '../../types';
import { TSchemaColumn, TSchemaTable } from '../../schema/types';
import { renderSql } from '../../util/helpers';
import { TCheckColumn } from '../../dialects/types';

export function createColumn (sql: TClientSql, table: TSchemaTable, column: TSchemaColumn) {
    return renderSql(
        `ALTER TABLE ${sql.q(table.name)}`,
        `    ADD COLUMN ${renderColumn(sql, table, column)}`
    );
}

export function updateColumn (sql: TClientSql, table: TSchemaTable, column: TSchemaColumn) {
    const alter = sql.dialect === 'postgres' ? 'ALTER' : 'MODIFY';

    return renderSql(
        `ALTER TABLE ${sql.q(table.name)}`,
        `    ${alter} COLUMN ${renderColumn(sql, table, column)}`
    );
}

export function dropColumn (sql: TClientSql, table: TSchemaTable, column: TCheckColumn) {
    return renderSql(
        `ALTER TABLE ${sql.q(table.name)}`,
        `    DROP COLUMN ${sql.q(column.name)}`
    );
}

export function renderColumn (sql: TClientSql, table: TSchemaTable, column: TSchemaColumn) {
    return `${sql.q(column.name)} ${sql.renderColumnType(table, column)}`;
}
