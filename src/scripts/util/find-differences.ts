import { TCheckColumn, TCheckForeignKey, TCheckIndex, TCheckTable } from '../../dialects/types';
import { getColumns, getForeignKeyName, getIds, getIndexName } from '../../schema/schema-parser';
import { TSchemaColumn, TSchemaForeignKey, TSchemaIndex, TSchemaTable } from '../../schema/types';
import { TColumnsDifference, TDifferences, TForeignKeysDifference, TIndexesDifference, TTablesDifference } from '../types';

export default function findDifferences (schemaTables: TSchemaTable[], checkTables: TCheckTable[]): TDifferences {
    const tables: TTablesDifference = { create: [], delete: [] };
    const columns: TColumnsDifference = { create: [], update: [], delete: [] };
    const indexes: TIndexesDifference = { create: [], delete: [] };
    const foreignKeys: TForeignKeysDifference = { create: [], delete: [] };

    const createTables = schemaTables.filter(schemaTable => !checkTables.some(checkTable => checkTable.name === schemaTable.name)).map(table => ({ table }));
    tables.create.push(...createTables);
    const createTablesFk = createTables.map(({ table }) => table.foreignKeys.map(foreignKey => ({ table, foreignKey }))).flat();
    foreignKeys.create.push(...createTablesFk);

    for (const checkTable of checkTables) {
        const schemaTable = schemaTables.find(schemaTable => schemaTable.name === checkTable.name);

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

            if (columnChanged(schemaColumn, checkColumn)) {
                columns.update.push({ table: schemaTable, column: schemaColumn });
            }
        }

        const createIndexes = schemaTable.indexes.filter(schemaIndex => !checkTable.indexes.some(checkIndex => checkIndex.name === getIndexName(schemaTable, schemaIndex))).map(index => ({ table: schemaTable, index }));
        indexes.create.push(...createIndexes);

        for (const checkIndex of checkTable.indexes) {
            const schemaIndex = schemaTable.indexes.find(schemaIndex => getIndexName(schemaTable, schemaIndex) === checkIndex.name);

            if (!schemaIndex) {
                indexes.delete.push({ table: schemaTable, index: checkIndex });
                continue;
            }

            if (indexChanged(schemaIndex, checkIndex)) {
                indexes.delete.push({ table: schemaTable, index: checkIndex });
                indexes.create.push({ table: schemaTable, index: schemaIndex });
            }
        }

        const createForeignKeys = schemaTable.foreignKeys.filter(schemaForeignKey => !checkTable.foreignKeys.some(checkForeignKey => checkForeignKey.name === getForeignKeyName(schemaTable, schemaForeignKey))).map(foreignKey => ({ table: schemaTable, foreignKey }));
        foreignKeys.create.push(...createForeignKeys);

        for (const checkForeignKey of checkTable.foreignKeys) {
            const schemaForeignKey = schemaTable.foreignKeys.find(schemaForeignKey => getForeignKeyName(schemaTable, schemaForeignKey) === checkForeignKey.name);

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

function columnChanged (schemaColumn: TSchemaColumn, checkColumn: TCheckColumn) {
    if (schemaColumn.type !== checkColumn.type) return false;
    if (schemaColumn.nullable !== checkColumn.nullable) return false;
    return true;
}

function indexChanged (schemaIndex: TSchemaIndex, checkIndex: TCheckIndex) {
    if (schemaIndex.type !== checkIndex.type) return false;
    if (getColumns(schemaIndex.column).join(',') !== checkIndex.columns.join(',')) return false;
    return true;
}

function foreignKeyChanged (schemaForeignKey: TSchemaForeignKey, checkForeignKey: TCheckForeignKey) {
    if (getIds(schemaForeignKey.id).join(',') !== checkForeignKey.ids.join(',')) return false;
    if (getColumns(schemaForeignKey.column).join(',') !== checkForeignKey.columns.join(',')) return false;
    if (schemaForeignKey.onDelete !== checkForeignKey.onDelete) return false;
    if (schemaForeignKey.onUpdate !== checkForeignKey.onUpdate) return false;
    return true;
}
