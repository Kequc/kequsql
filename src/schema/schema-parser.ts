import { TSchemaColumnDefault } from './schema-types';

export function getColumns (columns: string | string[]) {
    return Array.isArray(columns) ? columns : [columns];
}

export function getIds (ids: string | string[]) {
    return Array.isArray(ids) ? ids : [ids];
}

export function getDefault (def: TSchemaColumnDefault<any>) {
    return typeof def === 'function' ? def() : def;
}

