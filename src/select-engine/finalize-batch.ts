import { DbTable, TAscDesc, TKey, TOrderOptions } from '../index';
import { TSchemaColumn, TWaiting } from '../types';
import { zipper } from '../helpers';

export default function finalizeBatch<T extends TKey> (
    batch: TWaiting<T>[],
    columns: TSchemaColumn[],
    rows2: DbTable[T][][],
    relations2: Record<string, DbTable[T][]>[][]
) {
    zipper([batch, rows2, relations2], (request, rows, relations) => {
        const result = zipper([rows, relations], (row, relation) => ({
            ...filterColumns(row, columns),
            ...relation
        })) as unknown as Partial<DbTable[T]>[];

        request.resolve(batch.length <= 1 ? result : sortRows(result, request.orderBy));
    });
}

function sortRows<T extends TKey> (rows: Partial<DbTable[T]>[], order: TOrderOptions<T>) {
    if (order === undefined) return rows;

    return [...rows].sort((a: Partial<DbTable[T]>, b: Partial<DbTable[T]>) => {
        for (const [column, direction] of (Object.entries(order) as [keyof DbTable[T], TAscDesc][])) {
            // compare string alphabetically using localcompare
            if (typeof a[column] === 'string' && typeof b[column] === 'string') {
                const abc = (a[column] as string).localeCompare(b[column] as string);
                if (abc !== 0) return direction === 'asc' ? abc : -abc;
            } else {
                if (a[column] > b[column]) return direction === 'asc' ? 1 : -1;
                if (a[column] < b[column]) return direction === 'asc' ? -1 : 1;
            }
        }

        return 0;
    });
}

function filterColumns<T extends TKey> (row: DbTable[T], columns: TSchemaColumn[]) {
    const result: Partial<DbTable[T]> = {};

    for (const column of columns) {
        result[column.name as keyof DbTable[T]] = row[column.name as keyof DbTable[T]];
    }

    return result;
}
