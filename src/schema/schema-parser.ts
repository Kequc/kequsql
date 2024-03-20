import { TSchemaColumnDefault, TSchemaForeignKey, TSchemaIndex, TSchemaOptions, TSchemaTable, TSchemaTableOptions } from './types';

export function createSchema (schema: TSchemaOptions): TSchemaOptions {
    return schema;
}

export function createTable (table: TSchemaTableOptions): TSchemaTableOptions {
    return table;
}

export function getColumns (columns: string | string[]) {
    return Array.isArray(columns) ? columns : [columns];
}

export function getIds (ids: string | string[]) {
    return Array.isArray(ids) ? ids : [ids];
}

export function getDefault (def: TSchemaColumnDefault<any>) {
    return typeof def === 'function' ? def() : def;
}

export function getIndexName (table: TSchemaTable, index: TSchemaIndex) {
    return `${table.name}_${getColumns(index.column).join('_')}_idx`;
}

export function getForeignKeyName (table: TSchemaTable, foreignKey: TSchemaForeignKey) {
    return `${table.name}_${getColumns(foreignKey.column).join('_')}_${foreignKey.table}_${getIds(foreignKey.id).join('_')}_fkey`;
}
