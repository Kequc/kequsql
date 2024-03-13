import prepareFind from './prepare-find';
import { TKey, TTable } from '../../project/private-types';
import { TFindManyOptions, TInternal, TQuery, TSchemaTable, TWaiting } from '../../project/types';
import getRelationsSets from './get-relations-sets';
import matchesWhere from './matches-where';
import splitIntoBatches from './split-into-batches';
import finalizeBatch from './finalize-batch';

const QUEUE = new Map<string, TWaiting[]>();

export default async function queue<T extends TKey> (
    db: TInternal,
    query: TQuery,
    tableName: string,
    options: TFindManyOptions<T>
): Promise<TTable<T>[]> {
    return await new Promise<TTable<T>[]>((resolve, reject) => {
        if (!QUEUE.has(tableName)) {
            QUEUE.set(tableName, []);
            setTimeout(resolveQueueItem<T>(db, tableName as TKey), 0);
        }

        QUEUE.get(tableName)!.push({ ...options, query, resolve, reject });
    });
}

function resolveQueueItem<T extends TKey> (db: TInternal, tableName: TKey) {
    return async function () {
        const waiting = QUEUE.get(tableName) || [];
        QUEUE.delete(tableName);
        if (waiting.length === 0) return;

        const batches = splitIntoBatches(waiting);
        const table = db.schema.tables.find(table => table.name === tableName);

        if (!table) {
            reject(waiting, new Error(`Table "${tableName}" does not exist`));
            return;
        }

        await Promise.all(batches.map(batch => resolveBatch<T>(db, batch, table)));
    };
}

async function resolveBatch<T extends TKey> (db: TInternal, batch: TWaiting[], table: TSchemaTable) {
    try {
        const query = batch[0].query; // all query attrs are the same in batch
        const { columns, rendered, values } = prepareFind(db.sql, batch, table);
        const results = await query<TTable<T>[]>(rendered, values);
        const rows2 = getRowsSets<T>(table, batch, results);
        const relations2 = await getRelationsSets(db, query, table, batch, rows2);

        finalizeBatch<T>(batch, columns, rows2, relations2);
    } catch (error) {
        reject(batch, error);
    }
}

function getRowsSets<T extends TKey> (table: TSchemaTable, batch: TWaiting[], results: TTable<T>[]) {
    const rows = results.map(result => {
        const row = { ...result };
        const booleanFields = table.columns.filter(column => column.type.mysql === 'TINYINT(1)').map(column => column.name);
        for (const booleanField of booleanFields) {
            (row as any)[booleanField] = Boolean((row as any)[booleanField]);
        }
        return row;
    });
    return batch.map(request => rows.filter(row => matchesWhere(row, request.where)));
}

function reject (batch: TWaiting[], reason: any) {
    for (const request of batch) {
        request.reject(reason);
    }
}
