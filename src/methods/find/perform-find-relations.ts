import { TFindManyOptions, TFindOptions, TInternal, TQuery, TRaw, TStrategy, TWhereOptions } from '../../types';
import { DbTable, DbTableWhere, TKey } from '../../../project/types';
import { TRelation } from '../../schema/schema-types';
import { dig, drill, zipper } from '../../helpers';
import performFind from './perform-find';
import matchesWhere from './matches-where';

export default async function performFindRelations<T extends TKey> (
    db: TInternal,
    query: TQuery,
    options: TFindManyOptions<T>,
    strategy: TStrategy[],
    rows: DbTable[T][],
) {
    const results = await Promise.all(strategy.map(async ({ relations, breadcrumb }) => {
        if (relations.length === 0) return [];

        return await Promise.all(relations.map(relation => performFind(
            db,
            query,
            relation.table,
            getRelationOptions(dig(options.include as TRaw, breadcrumb), relation, rows, breadcrumb),
        )));
    }));

    return rows.map(row => {
        const more = strategy.reduce((acc, { relations, breadcrumb }, i) => {
            for (let j = 0; j < relations.length; j++) {
                const displayTable = relations[j].displayTable;
                const where = getRowWhere(relations[j], row, breadcrumb);
                const rows = results[i][j].filter(row => matchesWhere(row, where));
                drill(acc, [...breadcrumb, displayTable], rows);
            }

            return acc;
        }, {} as Record<string, unknown>);

        return { ...row, ...more } as DbTable[T];
    });
}

function getRelationOptions<T extends TKey> (
    options: TFindOptions<T>,
    relation: TRelation,
    rows: DbTable[T][],
    breadcrumb: string[],
) {
    const include = options.include?.[relation.displayTable as keyof typeof options.include] as TFindOptions<T> | true | undefined;
    const where = getRelationWhere(relation, rows, breadcrumb);

    if (include === true) return { where };
    if (!include.where) return { ...include, where };

    return { ...include, where: { and: [where, include.where] } };
}

function getRelationWhere<T extends TKey> (relation: TRelation, rows: DbTable[T][], breadcrumb: string[]) {
    if (relation.ids.length === 1) {
        const id = relation.ids[0] as keyof DbTableWhere[T];
        const column = relation.columns[0] as keyof DbTable[T];
        return { [id]: { in: rows.map(row => row[column]) } } as TWhereOptions<T>;
    }

    const or: TWhereOptions<T>[] = [];

    for (const row of rows) {
        or.push(getRowWhere(relation, row, breadcrumb));
    }

    return { or };
}

function getRowWhere<T extends TKey> (relation: TRelation, row: DbTable[T], breadcrumb: string[]) {
    const where: TWhereOptions<T> = {};
    const data = dig(row as unknown as TRaw, breadcrumb);

    zipper([relation.ids, relation.columns], (id, column) => {
        where[id as keyof DbTableWhere[T]] = data[column] as any;
    });

    return where;
}
