import { TFindManyOptions, TInternal, TQuery, TRaw } from '../../types';
import { DbTable, TKey } from '../../../project/types';
import { TSchemaTable } from '../../schema/schema-types';
import prepareFind from './prepare-find';
import { TFindStrategy, drill } from './helpers';
import performFindRelations from './perform-find-relations';

export default async function performFind<T extends TKey> (
    db: TInternal,
    query: TQuery,
    table: TSchemaTable,
    options: TFindManyOptions<T>,
): Promise<DbTable[T][]> {
    const { rendered, strategy, values } = prepareFind(db, table, options);

    const raw = await query<TRaw[]>(rendered, values);
    const rows = reconstructRows<T>(raw, strategy);

    return await performFindRelations(db, query, options, strategy, rows);
}

function reconstructRows<T extends TKey> (raw: TRaw[], strategy: TFindStrategy[]): DbTable[T][] {
    return raw.map(row => {
        const result = buildRow(row, strategy, 0);

        for (let index = 1; index < strategy.length; index++) {
            const { breadcrumb, columns } = strategy[index];
            if (columns.length === 0) continue;
            drill(result, breadcrumb, buildRow(row, strategy, index));
        }

        return result as unknown as DbTable[T];
    });
}

function buildRow (row: TRaw, strategy: TFindStrategy[], index: number): TRaw {
    const result: TRaw = {};
    const { columns } = strategy[index];

    for (let i = 0; i < columns.length; i++) {
        const column = columns[i];
        result[column.name] = row[`t${index}_${i}` as keyof typeof row] ?? null;
    }

    return result;
}
