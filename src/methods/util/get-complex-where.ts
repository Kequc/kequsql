import { TWhereOptions } from '@/types';
import { DbTable, TKey } from '@project/types';

export default function getComplexWhere<T extends TKey> (
    parentRows: DbTable[T][],
    ids: string[],
    columns?: string[]
): TWhereOptions<T> {
    if (!columns) columns = ids;

    if (columns.length === 1) {
        const key = ids[0];
        const resultKey = columns[0] as keyof DbTable[T];

        return {
            [key]: { in: parentRows.map(row => row[resultKey]) }
        } as TWhereOptions<T>; // TODO: fix this any
    }

    const where: TWhereOptions<T>[] = [];

    for (const row of parentRows) {
        const q: TWhereOptions<T> = {};

        for (let i = 0; i < ids.length; i++) {
            const key = ids[i] as keyof TWhereOptions<T>;
            const resultKey = columns[i] as keyof DbTable[T];
            q[key] = row[resultKey] as any; // TODO: fix this any
        }

        where.push(q);
    }

    return { or: where } as TWhereOptions<T>;
}
