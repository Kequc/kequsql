import { DbTable, DbTableInclude, DbTableOptions, DbTableSelect, DbTableWhere, TKey } from '@project/types';
import { TRelation, TSchema, TSchemaColumn, TSchemaOptions, TSchemaTable } from '@/schema/schema-types';

export type TScheme = 'mysql' | 'postgres';
export interface TConnectionAttrs {
    scheme: TScheme;
    host: string;
    user: string;
    password: string;
    database: string;
    port?: number;
}

export interface TOptions {
    connection: string | TConnectionAttrs;
    schema: TSchemaOptions;
    connectionLimit?: number;
}

export type TQuery = <T = unknown> (sql: string, values?: unknown[], silent?: boolean) => Promise<T>;
export type TTransaction = <T = unknown> (cb: (query: TQuery) => Promise<T>) => Promise<T>;

export type TSchemeSql = {
    q: (value: string) => string;
};
export type TSchemeConnection = {
    query: TQuery;
    transaction: TTransaction;
};

export interface TStrategy {
    table: TSchemaTable;
    breadcrumb: string[];
    columns: TSchemaColumn[];
    relations: TRelation[];
    parentTable?: TSchemaTable;
}

export type TKequsql = TInternal & TProjTables;
export type TInternal = TSchemeConnection & {
    info: { scheme: TScheme; database: string; }
    sql: TSchemeSql;
    schema: TSchema;
    getTable (name: string): TProjTable<any>;
};
export type TProjTables = { [name in TKey]: TProjTable<name> };

export type TProjTable<T extends TKey> = {
    find: (options?: TFindOptions<T>) => Promise<DbTable[T] | undefined>;
    findMany: (options?: TFindManyOptions<T>) => Promise<DbTable[T][]>;
    create: (options: TCreateOptions<T>) => Promise<DbTable[T]>;
    createMany: (options: TCreateManyOptions<T>) => Promise<DbTable[T][]>;
    update: (options: TUpdateOptions<T>) => Promise<DbTable[T][]>;
    updateMany: (options: TUpdateManyOptions<T>) => Promise<DbTable[T][]>;
    destroy: (options: TDestroyOptions<T>) => Promise<DbTable[T] | undefined>;
    destroyMany: (options: TDestroyManyOptions<T>) => Promise<DbTable[T][]>;
};

export type TFindOptions<T extends TKey> = {
    where?: TWhereOptions<T>;
    offset?: number;
    orderBy?: TOrderByOptions<T>;
    select?: TSelectOptions<T>;
    include?: TIncludeOptions<T>;
};
export type TFindManyOptions<T extends TKey> = TFindOptions<T> & {
    limit?: number;
};

export type TCreateOptions<T extends TKey> = {
    data: DbTableOptions[T];
    skipReturn?: true;
};
export type TCreateManyOptions<T extends TKey> = {
    data: DbTableOptions[T][];
    skipReturn?: true;
};

export type TUpdateOptions<T extends TKey> = {
    where?: TWhereOptions<T>;
    data: DbTableOptions[T];
    orderBy?: TOrderByOptions<T>;
    select?: TSelectOptions<T>;
    include?: TIncludeOptions<T>;
    skipReturn?: true;
};
export type TUpdateManyOptions<T extends TKey> = {
    changes: {
        where?: TWhereOptions<T>;
        data: DbTableOptions[T];
    }[],
    orderBy?: TOrderByOptions<T>;
    select?: TSelectOptions<T>;
    include?: TIncludeOptions<T>;
    skipReturn?: true;
};

export type TDestroyOptions<T extends TKey> = {
    where?: TWhereOptions<T>;
    orderBy?: TOrderByOptions<T>;
    select?: TSelectOptions<T>;
    include?: TIncludeOptions<T>;
    skipReturn?: true;
};
export type TDestroyManyOptions<T extends TKey> = TDestroyOptions<T> & {
    limit?: number;
};

export type TWhereModifier<T> = T | TWhereModifierIn<T>;
export type TWhereModifierIn<T> = {
    in?: T[];
    notIn?: T[];
    lt?: T;
    lte?: T;
    gt?: T;
    gte?: T;
    ne?: T;
    like?: T;
    notLike?: T;
    isNull?: true;
    isNotNull?: true;
};

export type TWhereOptions<T extends TKey> = DbTableWhere[T] & {
    or?: TWhereOptions<T>[];
    and?: TWhereOptions<T>[];
};
export type TAscDesc = 'asc' | 'desc';
export type TOrderByOptions<T extends TKey> = Partial<{ [name in keyof DbTableSelect[T]]: TAscDesc }>;
export type TSelectOptions<T extends TKey> = DbTableSelect[T];
export type TIncludeOptions<T extends TKey> = DbTableInclude[T];
export type TRow = Record<string, unknown>;

export type TInsertResponse = {
    insertId: number;
    affectedRows: number;
};
