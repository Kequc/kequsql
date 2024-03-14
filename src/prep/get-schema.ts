import { arraysMatch, deepFreeze, getDisplayTable } from '../helpers';
import { TKey } from '../index';
import { TOptions } from '../types';
import { TSchema, TSchemaForeignKey, TSchemaIndex, TSchemaTable, TSchemaTableOptions, TRelation, TReturnStrategy } from '../schema/schema-types';
import validateSchema from '../schema/validate-schema';
import { getColumns, getIds } from '../schema/schema-parser';

export default function getSchema ({ schema }: TOptions): TSchema {
    let index = 0;
    const tables: TSchemaTable[] = schema.tables.map((table) => ({
        name: table.name as TKey,
        abbr: `t${index++}`,
        columns: table.columns ?? [],
        indexes: getIndexes(table),
        foreignKeys: getForeignKeys(table),
        relations: getRelations(schema.tables, table.name as TKey),
        returnStrategy: getReturnStrategy(table)
    }));

    validateSchema(tables);
    return deepFreeze({ tables });
}

function getIndexes (table: TSchemaTableOptions): TSchemaIndex[] {
    const foreignKeys = getForeignKeys(table);
    const indexes = (table.indexes ?? []).map(index => ({
        ...index,
        name: index.type === 'primary' ? 'PRIMARY' : `${table.name}_${getColumns(index.column).join('_')}_idx`
    }));
    const fkIndexes: TSchemaIndex[] = foreignKeys
        // ensure that the x foreign key columns match the index's first x columns
        .filter(fk => !indexes.some(index => getColumns(fk.column).every((col, i) => col === getColumns(index.column)[i])))
        .map(fk => ({
            name: `${table.name}_${getColumns(fk.column).join('_')}_idx`,
            type: 'index',
            column: fk.column,
        }));

    return [...indexes, ...fkIndexes];
}

function getForeignKeys (table: TSchemaTableOptions): TSchemaForeignKey[] {
    return (table.foreignKeys ?? []).map(fk => ({
        ...fk,
        name: `${table.name}_${getColumns(fk.column).join('_')}_${fk.table}_${getIds(fk.id).join('_')}_fk`
    }));
}

function getRelations (tables: TSchemaTableOptions[], name: TKey): TRelation[] {
    const result: TRelation[] = [];
    const parentTable = tables.find(table => table.name === name);

    for (const foreignKey of parentTable?.foreignKeys ?? []) {
        result.push({
            columns: getColumns(foreignKey.column),
            ids: getIds(foreignKey.id),
            table: foreignKey.table,
            displayTable: getDisplayTable(foreignKey.table, true),
            singular: true,
            cascade: foreignKey.onDelete === 'cascade'
        });
    }

    for (const table of tables) {
        for (const foreignKey of table.foreignKeys ?? []) {
            if (name !== foreignKey.table) continue;
            const singular = calcSingular(table, foreignKey);
            result.push({
                columns: getIds(foreignKey.id),
                ids: getColumns(foreignKey.column),
                table: table.name as TKey,
                displayTable: getDisplayTable(table.name, singular),
                singular,
                cascade: false
            });
        }
    }

    // do not create relation if more than one foreign
    // key points to this table
    return result.filter(relation => result.filter(r => r.table === relation.table).length === 1);
}

function calcSingular (table: TSchemaTableOptions, foreignKey: TSchemaForeignKey) {
    const relevant = (table.indexes ?? []).filter(index => index.type === 'unique');
    if (relevant.length < 1) return false;

    return relevant.some(index => arraysMatch(getColumns(index.column), getColumns(foreignKey.column)));
}

function getReturnStrategy (table: TSchemaTableOptions): TReturnStrategy {
    const increment = table.columns?.find(column => column.type === 'integer' && column.auto)?.name;
    const primary = findIndex(table, 'primary')?.column;
    const unique = findIndex(table, 'unique')?.column;

    return {
        increment,
        unique: primary ? getColumns(primary) : unique ? getColumns(unique) : undefined,
    };
}

function findIndex (table: TSchemaTableOptions, type: string): TSchemaIndex | undefined {
    const indexes = table.indexes?.filter(index => index.type === type) ?? [];

    return indexes.find(index => {
        const columns = (table.columns ?? []).filter(column => getColumns(index.column).includes(column.name));
        if (getColumns(index.column).length !== columns.length) return false;
        return columns.every(column => !column.nullable);
    });
}
