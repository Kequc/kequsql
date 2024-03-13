import { TKey, TTable } from '../../project/private-types';
import { TCreateManyOptions, TInternal, TQuery, TRelation, TSchemaTable } from '../../project/types';
import queue from '../select-engine/queue';
import { zipper } from '../util/helpers';
import prepareCreate from './prepare-create';
import getComplexWhere from './util/get-complex-where';
import { verifyCreateReturn } from './util/verify-return-strategy';

type TInsertResponse = {
    insertId: number;
    affectedRows: number;
};

export default async function performCreate<T extends TKey> (
    db: TInternal,
    query: TQuery,
    table: TSchemaTable,
    options: TCreateManyOptions<T>
): Promise<TTable<T>[]> {
    verifyCreateReturn(options, table);

    const { sql, batches, batchValues, batchData, relations } = prepareCreate(db.sql, table, options);
    const result: TTable<T>[] = [];

    for (let i = 0; i < batchData.length; i++) {
        const batch = batches[i];
        const values = batchValues[i];
        const data = batchData[i];
        const response = await query<TInsertResponse>(sql, [values]);
        const rows = await getReturn(db, query, table, data, response);
        const relationRows = await getRelationRows(db, query, table, rows, {
            ...options,
            data: batch
        });

        // TODO: this is basically cheating should reduce the amount of queries
        if (options.skipReturn) continue;
        result.push(...zipper([rows, relationRows], (row, relationRow) => ({
            ...row,
            ...relationRow
        })));
    }

    return result;
}

async function getRelationRows (
    db: TInternal,
    query: TQuery,
    table: TSchemaTable,
    rows: TTable<any>[],
    options: TCreateManyOptions<any>
): Promise<Partial<TTable<any>>[]> {
    const promises2: Promise<Partial<TTable<any>[]>>[][] = [];
    const relations2: TRelation[][] = [];

    zipper([rows, options.data], (row, data) => {
        if (!row) {
            throw new Error('Missing row after create ' + JSON.stringify(data));
        }

        const promises: Promise<TTable<any>[]>[] = [];
        const relations: TRelation[] = [];

        for (const relation of table.relations) {
            if (data[relation.displayTable] === undefined) continue;

            promises.push(performCreateRelation(db, query, options, row, data, relation));
            relations.push(relation);
        }

        promises2.push(promises);
        relations2.push(relations);
    });

    const results3 = await Promise.all(promises2.map(promises => Promise.all(promises)));

    return zipper([results3, relations2], (results2, relations) => {
        const relationRow: Record<string, any> = {};

        zipper([results2, relations], (results, relation) => {
            relationRow[relation.displayTable] = relation.singular ? results[0] : results;
        });

        return relationRow as Partial<TTable<any>>;
    });
}

// TODO: I'm performing a separate insert for each relation on each row.
// I should be able to reduce this to at least one per table.
async function performCreateRelation (
    db: TInternal,
    query: TQuery,
    options: TCreateManyOptions<any>,
    parentRow: TTable<any>,
    parentData: Partial<TTable<any>>,
    relation: TRelation
) {
    const table = db.schema.tables.find(table => table.name === relation.table)!;
    const data = parentData[relation.displayTable] as any;
    const newData = (Array.isArray(data) ? data : [data]).map(getNewData(parentRow, relation));

    return await performCreate(db, query, table, {
        ...options,
        data: newData
    });
}

function getNewData (parentRow: TTable<any>, relation: TRelation) {
    return function (data: any) {
        const result = { ...data };
        zipper([relation.ids, relation.columns], (id, column) => {
            result[id] = parentRow[column];
        });
        return result;
    }
}

async function getReturn (
    db: TInternal,
    query: TQuery,
    table: TSchemaTable,
    data: Partial<TTable<any>>[],
    response: TInsertResponse
): Promise<TTable<any>[]> {
    const { unique, increment } = table.returnStrategy;

    if (unique && data.every(row => unique.every(column => row[column] !== undefined))) {
        return await findByUnique(db, query, table, data);
    }
    if (increment) {
        return await findByIncrement(db, query, table, response);
    }

    return [];
}

async function findByUnique (
    db: TInternal,
    query: TQuery,
    table: TSchemaTable,
    data: Partial<TTable<any>>[]
) {
    const key = table.name;
    const columns = table.returnStrategy.unique!;

    return await queue<typeof key>(db, query, key, {
        where: getComplexWhere(data, columns)
    });
}

async function findByIncrement (
    db: TInternal,
    query: TQuery,
    table: TSchemaTable,
    response: TInsertResponse
) {
    const key = table.name;
    const column = table.returnStrategy.increment!;

    return await queue<typeof key>(db, query, key, {
        where: {
            [column]: { lte: response.insertId }
        },
        limit: response.affectedRows,
        order: { [column]: 'DESC' }
    });
}
