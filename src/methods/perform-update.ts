import { TKey, TTable } from '../../project/private-types';
import { TInternal, TQuery, TSchemaTable, TUpdateManyOptions, TWhereOptions } from '../../project/types';
import reduceWheres from './util/reduce-wheres';
import prepareUpdate from './prepare-update';
import { verifyUpdateReturn } from './util/verify-return-strategy';
import queue from '../select-engine/queue';
import getComplexWhere from './util/get-complex-where';

export default async function performUpdate<T extends TKey> (
    db: TInternal,
    query: TQuery,
    table: TSchemaTable,
    options: TUpdateManyOptions<T>
): Promise<TTable<T>[]> {
    verifyUpdateReturn(options, table);

    const lookup = await prepareLookup<T>(db, query, table, options);
    if (lookup === undefined) return [];

    await Promise.all(options.changes.map(change => {
        const { sql, values } = prepareUpdate(db.sql, table, change);
        if (!sql) return Promise.resolve();
        return query(sql, values);
    }));

    if (options.skipReturn) return [];

    return await queue(db, query, table.name, {
        where: lookup,
        order: options.order,
        select: options.select,
        include: options.include
    });
}

// TODO: it's totally possible to update these keys and thus the lookup
// will be inaccurate
async function prepareLookup<T extends TKey> (
    db: TInternal,
    query: TQuery,
    table: TSchemaTable,
    options: TUpdateManyOptions<T>
): Promise<TWhereOptions<T> | undefined> {
    if (options.skipReturn) return {};

    const wheres = options.changes.map(change => change.where).filter(Boolean);
    const select: Record<string, true> = {};
    const columns = table.returnStrategy.unique!;

    for (const column of columns) {
        select[column] = true;
    }

    const rows = await queue(db, query, table.name, {
        select,
        where: reduceWheres(wheres)
    });

    if (rows.length === 0) return undefined;

    return getComplexWhere<T>(rows, columns);
}
