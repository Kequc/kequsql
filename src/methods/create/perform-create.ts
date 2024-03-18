import { TCreateManyOptions, TInsertResponse, TInternal, TQuery, TRow } from '@/types';
import { DbTable, TKey } from '@project/types';
import { TRelation, TSchemaTable } from '@/schema/schema-types';
import { verifyCreateReturn } from '@/schema/validate-schema';
import prepareCreate from './prepare-create';
import getReturnOptions from './get-return-options';
import performCreateRelation from './perform-create-relations';
import performFind from '../find/perform-find';

export default async function performCreate<T extends TKey> (
    db: TInternal,
    query: TQuery,
    table: TSchemaTable,
    options: TCreateManyOptions<T>,
): Promise<DbTable[T][]> {
    verifyCreateReturn(options, table);

    const { rendered, relations, values3, unique } = prepareCreate(db, table, options);
    const select = getMinimalSelect(relations, options.skipReturn);
    const allRows: TRow[] = [];

    for (const values2 of values3) {
        const response = await query<TInsertResponse>(rendered, values2);

        if (options.skipReturn && relations.length < 1) continue;

        const rows = await performFind<T>(db, query, table, {
            ...getReturnOptions<T>(table, values2, response, unique),
            select,
        });

        if (rows.length !== values2.length) {
            console.warn('Mismatched number of inserts and rows', values2.length, rows.length);
        }

        allRows.push(...rows as unknown as TRow[]);
    }

    const result = await performCreateRelation<T>(db, query, relations, allRows, options);

    return result as unknown as DbTable[T][];
}

function getMinimalSelect (relations: TRelation[], skipReturn: boolean) {
    if (!skipReturn) return undefined; // select all

    const select: Record<string, true> = {};

    for (const relation of relations) {
        for (const column of relation.columns) {
            select[column] = true;
        }
    }

    return select;
}
