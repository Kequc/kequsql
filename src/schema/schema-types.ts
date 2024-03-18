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

export type TSchemaIndexType = 'primary' | 'index' | 'unique' | 'fulltext';
export type TSchemaIndex = {
    type: TSchemaIndexType;
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
    table: TSchemaTable;
    ids: string[];
    columns: string[];
    displayTable: string;
    singular: boolean;
}

export interface TReturnStrategy {
    increment?: string;
    unique?: string[];
}
