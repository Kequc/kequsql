import { TSchemaColumn, TSchemaTable } from '../../schema/types';
import { TClientSql } from '../../types';
import { createIndex, dropIndex } from '../sql-generator';
import { createColumn, dropColumn, updateColumn } from '../sql-generator/column';
import { createForeignKey, dropForeignKey } from '../sql-generator/foreign-key';
import { createTable, dropTable } from '../sql-generator/table';
import { TDifferences } from '../types';

interface TAdjustedColumn {
    table: TSchemaTable;
    column: TSchemaColumn;
}

export default function createMigration (
    sql: TClientSql,
    { foreignKeys, indexes, columns, tables }: TDifferences,
) {
    const migration: string[] = [];
    const fixColumns: Map<string, TAdjustedColumn> = new Map();

    function addAdjusted (table: TSchemaTable, column: TSchemaColumn) {
        fixColumns.set(`${table.name}.${column.name}`, { table, column });
    }

    for (const { table, foreignKey } of foreignKeys.delete) {
        migration.push(dropForeignKey(sql, table, foreignKey));
    }

    for (const { table, index } of indexes.delete) {
        const column = table.columns.find(column => column.name === index.columns[0]);

        if (column && column.type === 'integer' && column.auto === true) {
            // index is on an incrementing column we need to drop the increment
            const adjustedColumn = getAdjustedColumn(column, true)[1];
            migration.push(updateColumn(sql, table, adjustedColumn));
            addAdjusted(table, column);
        }

        migration.push(dropIndex(sql, table, index));
    }

    for (const { table, column } of columns.delete) {
        migration.push(dropColumn(sql, table, column));
    }

    for (const { table } of tables.delete) {
        migration.push(dropTable(sql, table));
    }

    for (const { table } of tables.create) {
        migration.push(createTable(sql, table));
    }

    for (const { table, column } of columns.create) {
        const [isAdjusted, adjustedColumn] = getAdjustedColumn(column, true);
        migration.push(createColumn(sql, table, adjustedColumn));

        if (isAdjusted) addAdjusted(table, column);
    }

    for (const { table, column } of columns.update) {
        // column is already updated
        if (fixColumns.has(`${table.name}.${column.name}`)) continue;

        const [isAdjusted, adjustedColumn] = getAdjustedColumn(column);
        migration.push(updateColumn(sql, table, adjustedColumn));

        if (isAdjusted) addAdjusted(table, column);
    }

    for (const { table, index } of indexes.create) {
        migration.push(createIndex(sql, table, index));
    }

    for (const { table, foreignKey } of foreignKeys.create) {
        migration.push(createForeignKey(sql, table, foreignKey));
    }

    // fix adjusted columns
    for (const { table, column } of [...fixColumns.values()]) {
        migration.push(updateColumn(sql, table, column));
    }

    return migration.filter(Boolean);
}

function getAdjustedColumn (column: TSchemaColumn, checkAuto = false): [boolean, TSchemaColumn] {
    let isAdjusted = false;
    const adjustedColumn = { ...column };

    if (checkAuto && adjustedColumn.type === 'integer' && adjustedColumn.auto === true) {
        // cannot use auto increment on new column without index
        isAdjusted = true;
        adjustedColumn.auto = false;
    }

    if (adjustedColumn.nullable !== true && (adjustedColumn.default === null || adjustedColumn.default === undefined)) {
        // cannot add a non-null column without a default value
        isAdjusted = true;
        adjustedColumn.default = getTemporaryDefaultValue(column);
    }

    return [isAdjusted, adjustedColumn];
}

function getTemporaryDefaultValue (column: TSchemaColumn) {
    const columnType = column.type;
    switch (columnType) {
        case 'boolean': return false;
        case 'date': return '1970-01-01';
        case 'datetime': return '1970-01-01 00:00:00';
        case 'enum': return column.values[0];
        case 'integer': return 0;
        case 'string': return '';
        case 'text': return '';
        case 'time': return '00:00:00';
        case 'uuid': return '00000000-0000-0000-0000-000000000000';
    }

    throw new Error(`Unknown column type: ${columnType}`);
}
