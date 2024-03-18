import { TFindOptions, TInternal, TQuery, TRow, TStrategy, TWhereOptions } from '@/types';
import { TKey } from '@project/types';
import { TRelation } from '@/schema/schema-types';
import { dig, drill, zipper } from '@/helpers';
import performFind from './perform-find';
import matchesWhere from '../util/matches-where';

export default async function performFindRelations<T extends TKey> (
    db: TInternal,
    query: TQuery,
    options: Pick<TFindOptions<T>, 'include'>,
    strategy: TStrategy[],
    rows: TRow[],
) {
    const results = await Promise.all(strategy.map(async ({ relations, breadcrumb }) => {
        return await Promise.all(relations.map(relation => performFind(
            db,
            query,
            relation.table,
            getRelationOptions(dig(options.include as TRow, breadcrumb), relation, rows, breadcrumb),
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
        }, {} as TRow);

        return { ...row, ...more } as TRow;
    });
}

function getRelationOptions<T extends TKey> (
    options: Pick<TFindOptions<T>, 'include'>,
    relation: TRelation,
    rows: TRow[],
    breadcrumb: string[],
) {
    const include = options.include?.[relation.displayTable as keyof typeof options.include] as TFindOptions<T> | true | undefined;
    const where = getRelationWhere(relation, rows, breadcrumb);

    if (include === true) return { where };
    if (!include.where) return { ...include, where };

    return {
        ...include,
        where: { and: [where, include.where] },
    };
}

function getRelationWhere<T extends TKey> (
    relation: TRelation,
    rows: TRow[],
    breadcrumb: string[],
) {
    if (relation.ids.length === 1) {
        const id = relation.ids[0];
        const column = relation.columns[0];
        return { [id]: { in: rows.map(row => row[column]) } } as TWhereOptions<T>;
    }

    const or: TWhereOptions<T>[] = [];

    for (const row of rows) {
        or.push(getRowWhere(relation, row, breadcrumb));
    }

    return { or };
}

function getRowWhere<T extends TKey> (
    relation: TRelation,
    row: TRow,
    breadcrumb: string[],
) {
    const where: TRow = {};
    const data = dig(row, breadcrumb);

    zipper([relation.ids, relation.columns], (id, column) => {
        where[id] = data[column];
    });

    return where as TWhereOptions<T>;
}
