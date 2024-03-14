export type TSchemaColumn = {
    name: string;
    nullable?: boolean;
} & ({
    type: 'boolean';
    default?: TSchemaColumnDefault<boolean>;
} | {
    type: 'date';
    default?: TSchemaColumnDefault<Date>;
    auto?: boolean;
} | {
    type: 'datetime';
    default?: TSchemaColumnDefault<Date>;
    auto?: boolean;
} | {
    type: 'enum';
    default?: TSchemaColumnDefault<string>;
    values: string[];
} | {
    type: 'integer';
    default?: TSchemaColumnDefault<number>;
    unsigned?: boolean;
    auto?: boolean;
} | {
    type: 'string';
    default?: TSchemaColumnDefault<string>;
    size?: number;
} | {
    type: 'text';
    default?: TSchemaColumnDefault<string>;
    size?: 'medium' | 'long' | number;
} | {
    type: 'time';
    default?: TSchemaColumnDefault<Date>;
    auto?: boolean;
} | {
    type: 'uuid';
    default?: TSchemaColumnDefault<string>;
    auto?: boolean;
});

export type TSchemaColumnDefault<T> = (() => T) | T;

export type TSchemaIndex = {
    type: 'primary' | 'index' | 'unique' | 'fulltext';
    column: string | string[];
};

export type TSchemaForeignKey = {
    table: string;
    id: string | string[];
    column: string | string[];
    onDelete?: TSchemaForeignKeyAction;
    onUpdate?: TSchemaForeignKeyAction;
    onUpdateDelete?: TSchemaForeignKeyAction;
};

export type TSchemaForeignKeyAction = 'cascade' | 'set null' | 'restrict';

export interface TSchema {
    tables: TSchemaTable[];
}
export interface TSchemaOptions {
    tables: TSchemaTableOptions[];
}

export interface TSchemaTable {
    name: string;
    abbr: string;
    columns: TSchemaColumn[];
    indexes: TSchemaIndex[];
    foreignKeys: TSchemaForeignKey[];
    relations: TRelation[];
    returnStrategy: TReturnStrategy;
}
export interface TSchemaTableOptions {
    name: string;
    columns?: TSchemaColumn[];
    indexes?: TSchemaIndex[];
    foreignKeys?: TSchemaForeignKey[];
}

export interface TRelation {
    table: string;
    ids: string[];
    columns: string[];
    displayTable: string;
    singular: boolean;
    cascade: boolean;
}

export interface TReturnStrategy {
    increment: string | undefined;
    unique: string[] | undefined;
}
