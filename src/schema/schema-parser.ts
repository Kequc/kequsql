import { TCheckForeignKey, TCheckIndex } from '../dialects/types';
import { TSchemaColumn, TSchemaColumnDefault, TSchemaForeignKey, TSchemaForeignKeyAction, TSchemaIndex, TSchemaOptions, TSchemaTable, TSchemaTableOptions } from './types';

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

export function getIndexName (tableName: string, column: string | string[]) {
    return `${tableName}_${getColumns(column).join('_')}_idx`;
}

export function getForeignKeyName (tableName: string, foreignKey: TSchemaForeignKey) {
    return `${tableName}_${getColumns(foreignKey.column).join('_')}_${foreignKey.table}_${getIds(foreignKey.id).join('_')}_fkey`;
}

export function getForeignKeyonUpdate (foreignKey: TSchemaForeignKey): TSchemaForeignKeyAction {
    return foreignKey.onUpdate ?? foreignKey.onUpdateDelete ?? 'no action';
}

export function getForeignKeyonDelete (foreignKey: TSchemaForeignKey): TSchemaForeignKeyAction {
    return foreignKey.onDelete ?? foreignKey.onUpdateDelete ?? 'no action';
}
