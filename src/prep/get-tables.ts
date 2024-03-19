import { TInternal, TProjTable, TProjTables, TCreateManyOptions, TCreateOptions, TDestroyManyOptions, TDestroyOptions, TFindManyOptions, TFindOptions, TUpdateManyOptions, TUpdateOptions } from '../types';
import { DbTable, TKey } from '@project/types';
import { TSchemaTable } from '@/schema/schema-types';
import performCreate from '@/methods/create/perform-create';
import performDestroy from '@/methods/destroy/perform-destroy';
import performUpdate from '@/methods/update/perform-update';
import performFind from '@/methods/find/perform-find';

export default function getTables (db: TInternal): TProjTables {
    const result: Record<string, TProjTable<any>> = {};

    for (const table of db.schema.tables) {
        const name = table.name as TKey;
        result[name] = getTable<typeof name>(db, table);
    }

    return result as unknown as TProjTables;
}

function getTable<T extends TKey> (db: TInternal, table: TSchemaTable): TProjTable<T> {
    return {
        find: buildFind<T>(db, table),
        findMany: buildFindMany<T>(db, table),
        create: buildCreate<T>(db, table),
        createMany: buildCreateMany<T>(db, table),
        update: buildUpdate<T>(db, table),
        updateMany: buildUpdateMany<T>(db, table),
        destroy: buildDestroy<T>(db, table),
        destroyMany: buildDestroyMany<T>(db, table)
    };
}

function buildFind<T extends TKey> (db: TInternal, table: TSchemaTable) {
    return async function find (options: TFindOptions<T> = {}): Promise<DbTable[T] | undefined> {
        const result = await performFind<T>(db, db.query, table, { ...options, limit: 1 });
        return result[0];
    };
}

function buildFindMany<T extends TKey> (db: TInternal, table: TSchemaTable) {
    return async function findMany (options: TFindManyOptions<T> = {}): Promise<DbTable[T][]> {
        return await performFind<T>(db, db.query, table, options);
    };
}

function buildCreate<T extends TKey> (db: TInternal, table: TSchemaTable) {
    return async function create (options: TCreateOptions<T>): Promise<DbTable[T]> {
        return await db.transaction(async (query) => {
            const result = await performCreate<T>(db, query, table, {
                ...options,
                data: options.data ? [options.data] : []
            });
            return result[0];
        });
    };
}

function buildCreateMany<T extends TKey> (db: TInternal, table: TSchemaTable) {
    return async function createMany (options: TCreateManyOptions<T>): Promise<DbTable[T][]> {
        return await db.transaction(async (query) => {
            return await performCreate<T>(db, query, table, options);
        });
    };
}

function buildUpdate<T extends TKey> (db: TInternal, table: TSchemaTable) {
    return async function update (options: TUpdateOptions<T>): Promise<DbTable[T][]> {
        return await db.transaction(async (query) => {
            return await performUpdate<T>(db, query, table, {
                changes: [{ where: options.where, data: options.data }],
                orderBy: options.orderBy,
                select: options.select,
                include: options.include,
                skipReturn: options.skipReturn
            });
        });
    };
}

function buildUpdateMany<T extends TKey> (db: TInternal, table: TSchemaTable) {
    return async function updateMany (options: TUpdateManyOptions<T>): Promise<DbTable[T][]> {
        return await db.transaction(async (query) => {
            return await performUpdate<T>(db, query, table, options);
        });
    };
}

function buildDestroy<T extends TKey> (db: TInternal, table: TSchemaTable) {
    return async function destroy (options: TDestroyOptions<T>): Promise<DbTable[T] | undefined> {
        const results = await db.transaction(async (query) => {
            return await performDestroy<T>(db, query, table, { ...options, limit: 1 });
        });
        return results[0];
    };
}

function buildDestroyMany<T extends TKey> (db: TInternal, table: TSchemaTable) {
    return async function destroyMany (options: TDestroyManyOptions<T>): Promise<DbTable[T][]> {
        return await db.transaction(async (query) => {
            return await performDestroy<T>(db, query, table, options);
        });
    };
}
