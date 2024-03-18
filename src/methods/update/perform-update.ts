import { TUpdateManyOptions, TInsertResponse, TInternal, TQuery } from '@/types';
import { DbTable, TKey } from '@project/types';
import { TSchemaTable } from '@/schema/schema-types';
import prepareUpdate from './prepare-update';
import performFind from '../find/perform-find';

// TODO: Doesn't support nested update

export default async function performUpdate<T extends TKey> (
    db: TInternal,
    query: TQuery,
    table: TSchemaTable,
    options: TUpdateManyOptions<T>,
): Promise<DbTable[T][]> {
    const updates = prepareUpdate(db, table, options);

    await Promise.all(updates.map(update => {
        return query<TInsertResponse>(update.rendered, update.values);
    }));

    if (options.skipReturn) return [];

    const rows = await performFind<T>(db, query, table, {
        where: { or: options.changes.map(change => change.where) },
        select: options.select,
        orderBy: options.orderBy,
        include: options.include,
    });

    return rows;
}
