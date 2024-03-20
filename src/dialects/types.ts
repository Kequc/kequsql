import { TSchemaForeignKeyAction, TSchemaIndexType } from '../schema/types';

export interface TCheckColumn {
    name: string;
    type: string;
}

export interface TCheckForeignKey {
    name: string;
    table: string;
    ids: string[];
    columns: string[];
    onDelete: TSchemaForeignKeyAction;
    onUpdate: TSchemaForeignKeyAction;
}

export interface TCheckIndex {
    name: string;
    type: TSchemaIndexType;
    columns: string[];
}

export interface TCheckTable {
    name: string;
    columns: TCheckColumn[];
    indexes: TCheckIndex[];
    foreignKeys: TCheckForeignKey[];
}
