import { TCheckColumn, TCheckForeignKey, TCheckIndex, TCheckTable } from '../../dialects/types';
import { getColumns, getForeignKeyName, getForeignKeyonDelete, getForeignKeyonUpdate, getIds, getIndexName } from '../../schema/schema-parser';
import { TSchemaForeignKey, TSchemaIndex } from '../../schema/types';
import { TInternal } from '../../types';
import { TColumnsDifference, TDifferences, TForeignKeysDifference, TIndexesDifference, TTablesDifference } from '../types';

export default function findDifferences ({ sql, schema }: TInternal, checkTables: TCheckTable[]): TDifferences {
    const tables: TTablesDifference = { create: [], delete: [] };
    const columns: TColumnsDifference = { create: [], update: [], delete: [] };
    const indexes: TIndexesDifference = { create: [], delete: [] };
    const foreignKeys: TForeignKeysDifference = { create: [], delete: [] };

    const createTables = schema.tables.filter(schemaTable => !checkTables.some(checkTable => checkTable.name === schemaTable.name)).map(table => ({ table }));
    tables.create.push(...createTables);
    const createTablesFk = createTables.map(({ table }) => table.foreignKeys.map(foreignKey => ({ table, foreignKey }))).flat();
    foreignKeys.create.push(...createTablesFk);

    for (const checkTable of checkTables) {
        const schemaTable = schema.tables.find(schemaTable => schemaTable.name === checkTable.name);

        if (!schemaTable) {
            tables.delete.push({ table: checkTable });
            continue;
        }

        const createColumns = schemaTable.columns.filter(schemaColumn => !checkTable.columns.some(checkColumn => checkColumn.name === schemaColumn.name)).map(column => ({ table: schemaTable, column }));
        columns.create.push(...createColumns);

        for (const checkColumn of checkTable.columns) {
            const schemaColumn = schemaTable.columns.find(schemaColumn => schemaColumn.name === checkColumn.name);

            if (!schemaColumn) {
                columns.delete.push({ table: schemaTable, column: checkColumn });
                continue;
            }

            if (columnChanged(sql.renderColumnType(schemaTable, schemaColumn), checkColumn)) {
                columns.update.push({ table: schemaTable, column: schemaColumn });
            }
        }

        const createIndexes = schemaTable.indexes.filter(schemaIndex => !checkTable.indexes.some(checkIndex => checkIndex.name === getIndexName(schemaTable.name, schemaIndex.column))).map(index => ({ table: schemaTable, index }));
        indexes.create.push(...createIndexes);

        for (const checkIndex of checkTable.indexes) {
            const schemaIndex = schemaTable.indexes.find(schemaIndex => getIndexName(schemaTable.name, schemaIndex.column) === checkIndex.name);

            if (!schemaIndex) {
                indexes.delete.push({ table: schemaTable, index: checkIndex });
                continue;
            }

            if (indexChanged(schemaIndex, checkIndex)) {
                indexes.delete.push({ table: schemaTable, index: checkIndex });
                indexes.create.push({ table: schemaTable, index: schemaIndex });
            }
        }

        const createForeignKeys = schemaTable.foreignKeys.filter(schemaForeignKey => !checkTable.foreignKeys.some(checkForeignKey => checkForeignKey.name === getForeignKeyName(schemaTable.name, schemaForeignKey))).map(foreignKey => ({ table: schemaTable, foreignKey }));
        foreignKeys.create.push(...createForeignKeys);

        for (const checkForeignKey of checkTable.foreignKeys) {
            const schemaForeignKey = schemaTable.foreignKeys.find(schemaForeignKey => getForeignKeyName(schemaTable.name, schemaForeignKey) === checkForeignKey.name);

            if (!schemaForeignKey) {
                foreignKeys.delete.push({ table: schemaTable, foreignKey: checkForeignKey });
                continue;
            }

            if (foreignKeyChanged(schemaForeignKey, checkForeignKey)) {
                foreignKeys.delete.push({ table: schemaTable, foreignKey: checkForeignKey });
                foreignKeys.create.push({ table: schemaTable, foreignKey: schemaForeignKey });
            }
        }
    }

    return {
        tables,
        columns,
        indexes,
        foreignKeys,
    };
}

function columnChanged (schemaColumnType: string, checkColumn: TCheckColumn) {
    if (schemaColumnType !== checkColumn.type) return true;
    return false;
}

function indexChanged (schemaIndex: TSchemaIndex, checkIndex: TCheckIndex) {
    if (schemaIndex.type !== checkIndex.type) return true;
    if (getColumns(schemaIndex.column).join(',') !== checkIndex.columns.join(',')) return true;
    return false;
}

function foreignKeyChanged (schemaForeignKey: TSchemaForeignKey, checkForeignKey: TCheckForeignKey) {
    if (getIds(schemaForeignKey.id).join(',') !== checkForeignKey.ids.join(',')) return true;
    if (getColumns(schemaForeignKey.column).join(',') !== checkForeignKey.columns.join(',')) return true;
    if (getForeignKeyonDelete(schemaForeignKey) !== checkForeignKey.onDelete) return true;
    if (getForeignKeyonUpdate(schemaForeignKey) !== checkForeignKey.onUpdate) return true;
    return false;
}
