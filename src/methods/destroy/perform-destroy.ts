import { DbTable, TKey } from '@project/types';
import { TDestroyManyOptions, TInternal, TQuery } from '@/types';
import { TSchemaTable } from '@/schema/schema-types';
import performFind from '../find/perform-find';
import prepareDestroy from './prepare-destroy';

export default async function performDestroy<T extends TKey> (
    db: TInternal,
    query: TQuery,
    table: TSchemaTable,
    options: TDestroyManyOptions<T>
): Promise<DbTable[T][]> {
    const result = options.skipReturn ? [] : await performFind<T>(db, query, table, {
        where: options.where,
        select: options.select,
        include: options.include,
        orderBy: options.orderBy,
        limit: options.limit,
    });
    const { rendered, values } = prepareDestroy(db.sql, table, options);

    // NOTE: on sqlite we need to perform foreign key cascade manually

    await query(rendered, values);

    return result;
}
