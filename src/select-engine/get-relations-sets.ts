import { DbTable, TKey, TTable } from '../index';
import { TInternal, TQuery, TRelation, TSchemaTable, TWaiting, TWhereOptions } from '../types';
import { zipper } from '../helpers';
import queue from './queue';

export default async function getRelationsSets<T extends TKey> (
    db: TInternal,
    query: TQuery,
    table: TSchemaTable,
    batch: TWaiting<T>[],
    parentRows2: DbTable[T][][]
): Promise<Record<string, DbTable[T][]>[][]> {
    const foreignKeys2 = getForeignKeysSet(table, batch);
    const rows4 = await getRowsSet(db, query, batch, parentRows2, foreignKeys2);

    // requests[] -> rows[] -> relations{}

    return buildRelations(foreignKeys2, rows4);
}

function getForeignKeysSet<T extends TKey> (
    table: TSchemaTable,
    batch: TWaiting<T>[]
) {
    // requests[] -> relations[]

    return batch.map(({ include }) => {
        if (include === undefined) return [];
        return table.relations.filter(({ displayTable }) => include[displayTable as keyof typeof include] !== undefined);
    });
}

async function getRowsSet<T extends TKey> (
    db: TInternal,
    query: TQuery,
    batch: TWaiting<T>[],
    parentRows2: DbTable[T][][],
    relations2: TRelation[][]
) {
    // returns deeply nested results
    // so that each row of each request has an array of foreign key results

    // requests[] -> parentRows[] -> relations[] -> rows[]

    return await Promise.all(
        zipper([
            batch,
            parentRows2,
            relations2
        ], (request, parentRows, relations) => Promise.all(
            parentRows.map(parentRow => Promise.all(
                relations.map(relation => queue(
                    db,
                    query,
                    relation.table,
                    buildRelationOptions(parentRow, request.include, relation)
                ))
            ))
        ))
    );
}

function buildRelations<T extends TKey> (
    relations2: TRelation[][],
    rows4: DbTable[T][][][][]
) {
    // requests[] -> rows[] -> relations{}

    return zipper([relations2, rows4], (relations, rows3) => {
        return rows3.map(rows2 => {
            const result: Record<string, DbTable[T][] | DbTable[T]> = {};

            zipper([relations, rows2], (relation, rows) => {
                const singular = relation.singular ?? true;
                result[relation.displayTable] = singular ? rows[0] : rows;
            });

            return result;
        });
    });
}

function buildRelationOptions<T extends TKey> (
    parentRow: DbTable[T],
    include: TTable<T, 'Include'>,
    { displayTable, ids, columns }: TRelation
) {
    const options = include[displayTable as keyof TTable<T, 'Include'>];
    const where: TWhereOptions<any> = {};

    zipper([ids, columns], (id, column) => {
        where[id] = parentRow[column as keyof DbTable[T]];
    });

    if (options === true) return { where };
    if (!options.where) return { ...options, where };

    return { ...options, where: { and: [where, options.where] } };
}
