import { TCheckColumn, TCheckForeignKey, TCheckIndex, TCheckTable } from '../dialects/check-types';
import { TSchemaColumn, TSchemaForeignKey, TSchemaIndex, TSchemaTable } from '../schema/schema-types';

export type TTablesDifference = {
    create: { table: TSchemaTable }[];
    delete: { table: TCheckTable }[];
};
export type TColumnsDifference = {
    create: { table: TSchemaTable, column: TSchemaColumn }[];
    update: { table: TSchemaTable, column: TSchemaColumn }[];
    delete: { table: TSchemaTable, column: TCheckColumn }[];
};
export type TIndexesDifference = {
    create: { table: TSchemaTable, index: TSchemaIndex }[];
    delete: { table: TSchemaTable, index: TCheckIndex }[];
};
export type TForeignKeysDifference = {
    create: { table: TSchemaTable, foreignKey: TSchemaForeignKey }[];
    delete: { table: TSchemaTable, foreignKey: TCheckForeignKey }[];
};
export type TDifferences = {
    tables: TTablesDifference;
    columns: TColumnsDifference;
    indexes: TIndexesDifference;
    foreignKeys: TForeignKeysDifference;
};
