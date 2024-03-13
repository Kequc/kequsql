import { arraysMatch, deepFreeze, getDisplayTable } from '../helpers';
import { TKey } from '../index';
import { TOptions, TRelation, TReturnStrategy, TSchema, TSchemaForeignKey, TSchemaIndex, TSchemaTable, TSchemaTableOptions } from '../types';
import validateSchema from '../schema/validate-schema';

export default function getSchema ({ schema }: TOptions): TSchema {
    const tables: TSchemaTable[] = schema.tables.map((table) => ({
        name: table.name as TKey,
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
        name: index.type === 'PRIMARY KEY' ? 'PRIMARY' : `${table.name}_${index.columns.join('_')}_idx`
    }));
    const fkIndexes: TSchemaIndex[] = foreignKeys
        // ensure that the x foreign key columns match the index's first x columns
        .filter(fk => !indexes.some(index => fk.columns.every((col, i) => col === index.columns[i])))
        .map(fk => ({
            name: `${table.name}_${fk.columns.join('_')}_idx`,
            type: 'INDEX',
            columns: fk.columns,
        }));

    return [...indexes, ...fkIndexes];
}

function getForeignKeys (table: TSchemaTableOptions): TSchemaForeignKey[] {
    return (table.foreignKeys ?? []).map(fk => ({
        ...fk,
        name: `${table.name}_${fk.columns.join('_')}_${fk.table}_${fk.ids.join('_')}_fk`
    }));
}

function getRelations (tables: TSchemaTableOptions[], name: TKey): TRelation[] {
    const result: TRelation[] = [];
    const parentTable = tables.find(table => table.name === name);

    for (const foreignKey of parentTable?.foreignKeys ?? []) {
        result.push({
            columns: foreignKey.columns,
            ids: foreignKey.ids,
            table: foreignKey.table,
            displayTable: getDisplayTable(foreignKey.table, true),
            singular: true,
            cascade: foreignKey.onDelete === 'CASCADE'
        });
    }

    for (const table of tables) {
        for (const foreignKey of table.foreignKeys ?? []) {
            if (name !== foreignKey.table) continue;
            const singular = calcSingular(table, foreignKey);
            result.push({
                columns: foreignKey.ids,
                ids: foreignKey.columns,
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
    const relevant = (table.indexes ?? []).filter(index => index.type === 'UNIQUE');
    if (relevant.length < 1) return false;

    return relevant.some(index => arraysMatch(index.columns, foreignKey.columns));
}

function getReturnStrategy (table: TSchemaTableOptions): TReturnStrategy {
    const increment = table.columns?.find(column => column.increment)?.name;
    const primary = findIndex(table, 'PRIMARY KEY')?.columns;
    const unique = findIndex(table, 'UNIQUE')?.columns;

    return {
        increment,
        unique: primary ?? unique
    };
}

function findIndex (table: TSchemaTableOptions, type: string): TSchemaIndex | undefined {
    const indexes = table.indexes?.filter(index => index.type === type) ?? [];

    return indexes.find(index => {
        const columns = (table.columns ?? []).filter(column => index.columns.includes(column.name));
        if (index.columns.length !== columns.length) return false;
        return columns.every(column => !column.nullable);
    });
}
