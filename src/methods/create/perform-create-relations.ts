import { TRelation } from '../../schema/types';
import { DbTableOptions, TKey } from '../../../project/types';
import { TRow, TCreateManyOptions, TInternal, TQuery, TWhereOptions } from '../../types';
import performCreate from './perform-create';
import { zipper } from '../../util/helpers';
import matchesWhere from '../../util/matches-where';

export default async function performCreateRelations<T extends TKey> (
    db: TInternal,
    query: TQuery,
    relations: TRelation[],
    rows: TRow[],
    options: TCreateManyOptions<T>,
): Promise<TRow[]> {
    for (const relation of relations) {
        const wheres = rows.map(row => getRowWhere(relation, row));
        const subRows = await performCreate(db, query, relation.table, {
            ...options,
            data: getRelationData(options, wheres, relation),
        });

        zipper([rows, wheres], (row, where) => {
            row[relation.displayTable] = subRows.filter(subRow => matchesWhere(subRow, where));
        });
    }

    return rows as TRow[];
}

function getRelationData<T extends TKey> (
    options: TCreateManyOptions<T>,
    wheres: TWhereOptions<T>[],
    relation: TRelation,
): DbTableOptions[T][] {
    const key = relation.displayTable as keyof DbTableOptions[T];

    if (relation.singular) {
        const data = options.data.map(data => data[key] as DbTableOptions[T]);

        return zipper([data, wheres], (relationData, where) => ({
            ...relationData,
            ...where,
        }));
    }

    const data2 = options.data.map(data => data[key] as DbTableOptions[T][]);

    return zipper([data2, wheres], (data, where) => {
        return data.map(relationData => ({
            ...relationData,
            ...where,
        }));
    }).flat();
}

function getRowWhere (
    relation: TRelation,
    row: TRow,
) {
    return relation.ids.reduce((where, id, i) => {
        where[id] = row[relation.columns[i]];
        return where;
    }, {} as TRow);
}
