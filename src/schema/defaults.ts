import { TSchemaColumn } from '../types';
import { COLUMN_TYPE } from './render-column-type';

export function columnDefaults (data: Partial<TSchemaColumn>): TSchemaColumn {
    return {
        name: data.name ?? '',
        type: data.type ?? COLUMN_TYPE.STRING,
        size: data.size,
        errata: data.errata,
        default: data.default,
        nullable: data.nullable ?? false,
        unsigned: data.unsigned ?? false,
        increment: data.increment ?? false,
    };
}
