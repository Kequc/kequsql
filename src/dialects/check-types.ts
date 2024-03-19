import { TSchemaForeignKeyAction, TSchemaIndexType } from '../schema/schema-types';

export interface TCheckColumn {
    name: string;
    nullable: boolean;
    type: string;
    default: string;
    extra: string;
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
