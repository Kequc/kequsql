import { TFindManyOptions, TInternal, TQuery, TRow, TStrategy } from '../../types';
import { DbTable, TKey } from '../../../project/types';
import { TSchemaTable } from '../../schema/schema-types';
import { drill } from '../../util/helpers';
import prepareFind from './prepare-find';
import performFindRelations from './perform-find-relations';

export default async function performFind<T extends TKey> (
    db: TInternal,
    query: TQuery,
    table: TSchemaTable,
    options: TFindManyOptions<T>,
): Promise<DbTable[T][]> {
    const { rendered, strategy, values } = prepareFind(db, table, options);

    const raw = await query<TRow[]>(rendered, values);
    const rows = reconstructRows(raw, strategy);
    const result = await performFindRelations(db, query, options, strategy, rows);

    return result as unknown as DbTable[T][];
}

function reconstructRows (raw: TRow[], strategy: TStrategy[]): TRow[] {
    return raw.map(row => {
        const result = buildRow(row, strategy, 0);

        for (let index = 1; index < strategy.length; index++) {
            const { breadcrumb, columns } = strategy[index];
            if (columns.length === 0) continue;
            const subRow = buildRow(row, strategy, index);
            if (Object.values(subRow).every(value => value === null)) continue;
            drill(result, breadcrumb, subRow);
        }

        return result;
    });
}

function buildRow (row: TRow, strategy: TStrategy[], index: number): TRow {
    const result: TRow = {};
    const { columns } = strategy[index];

    for (let i = 0; i < columns.length; i++) {
        const column = columns[i];
        result[column.name] = row[`t${index}_${i}`] ?? null;
    }

    return result;
}
