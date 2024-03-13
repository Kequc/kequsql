import { TKey, TTable } from '../../project/private-types';
import { TDestroyManyOptions, TInternal, TQuery, TSchemaTable } from '../../project/types';
import queue from '../select-engine/queue';
import prepareDestroy from './prepare-destroy';

export default async function performDestroy<T extends TKey> (
    db: TInternal,
    query: TQuery,
    table: TSchemaTable,
    options: TDestroyManyOptions<T>
): Promise<TTable<T>[]> {
    const results = options.skipReturn ? [] : await queue<T>(db, query, table.name, {
        select: options.select,
        where: options.where,
        include: options.include,
        order: options.order,
        limit: options.limit
    });
    const { sql, values } = prepareDestroy(db.sql, table, options);

    // TODO: on sqlite we need to perform foreign key cascade manually

    await query(sql, values);

    return results;
}
