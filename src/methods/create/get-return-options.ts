import { TSchemaTable } from '../../schema/schema-types';
import { TKey } from '../../../project/types';
import { TFindManyOptions, TInsertResponse, TRow } from '../../types';

export default function getReturnOptions<T extends TKey> (
    table: TSchemaTable,
    values2: TRow[][],
    response: TInsertResponse,
    unique: number[],
): TFindManyOptions<T> {
    const { increment } = table.returnStrategy;

    if (unique.length > 0 && unique.every(i => i > -1)) {
        return findByUnique(table, values2, unique);
    }
    if (increment) {
        return findByIncrement(table, response);
    }

    return undefined;
}

function findByUnique (
    table: TSchemaTable,
    values2: TRow[][],
    unique: number[],
) {
    const columns = table.returnStrategy.unique!;

    if (columns.length === 1) {
        const key = columns[0];
        const index = unique[0];

        return { where: { [key]: { in: values2.map(values => values[index]) } } };
    }

    const or = values2.map(values => {
        const where: TRow = {};

        for (let i = 0; i < columns.length; i++) {
            const key = columns[i];
            const value = values[unique[i]];
            where[key] = value;
        }

        return where;
    });

    return { where: { or } };
}

function findByIncrement (
    table: TSchemaTable,
    response: TInsertResponse,
) {
    const column = table.returnStrategy.increment!;

    return {
        where: { [column]: { lte: response.insertId } },
        limit: response.affectedRows,
        order: { [column]: 'desc' },
    };
}
