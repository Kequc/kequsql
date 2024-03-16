import { renderSql } from '../../helpers';
import { TKey } from '../../../project/types';
import { TRelation, TSchemaColumn, TSchemaTable } from '../../schema/schema-types';
import { TFindManyOptions, TFindOptions, TInternal, TWhereOptions } from '../../types';
import { renderWhere } from '../util/render-where';
import { TFindStrategy, renderFrom, renderLimit, renderOrderBy, renderSelect } from './helpers';

export default function prepareFind<T extends TKey> (
    db: TInternal,
    table: TSchemaTable,
    options: TFindManyOptions<T>,
) {
    const strategy = calcStrategy(table, options, []);
    const [whereSql, values] = renderWhere(db.sql, table, options.where);

    const rendered = renderSql(
        `SELECT ${renderSelect(db.sql, strategy)}`,
        ...renderFrom(db.sql, strategy, table.relations),
        whereSql ? `WHERE ${whereSql}` : '',
        renderOrderBy(db.sql, options.orderBy),
        renderLimit(options),
    );

    return {
        rendered,
        strategy,
        values
    };
}

function calcStrategy<T extends TKey> (
    table: TSchemaTable,
    options: Pick<TFindOptions<T>, 'include' | 'select' | 'where'>,
    breadcrumb: string[],
): TFindStrategy[] {
    const joins = filterJoinRelations(table, options).map(join => calcStrategy(
        join.table,
        getJoinOptions(options, join.displayTable),
        [...breadcrumb, join.displayTable],
    )).flat();

    const relationKeys = Object.keys(options.include ?? {});
    const relations = table.relations.filter(({ displayTable, singular }) => !singular && relationKeys.includes(displayTable));

    return [{
        table,
        breadcrumb,
        columns: filterColumns(table, options, relations),
        relations,
    }, ...joins];
}

function getJoinOptions<T extends TKey> (options: TFindOptions<T>, displayTable: string) {
    const where = options.where?.[displayTable as keyof typeof options.where] as TWhereOptions<T> | undefined;
    const include = options.include?.[displayTable as keyof typeof options.include] as TFindOptions<T> | true | undefined;

    if (include === undefined) return { select: {}, where } as TFindOptions<T>;
    if (include === true) return { where } as TFindOptions<T>;
    return { ...include, where: combineWheres(include.where, where) } as TFindOptions<T>;
}

function combineWheres<T extends TKey> (...wheres: (TWhereOptions<T> | undefined)[]) {
    const or: TWhereOptions<T>[] = wheres.filter(Boolean);

    if (or.length === 0) return undefined;
    if (or.length === 1) return or[0];
    return { or };
}

function filterColumns<T extends TKey> (
    table: TSchemaTable,
    options: Pick<TFindOptions<T>, 'include' | 'select' | 'where'>,
    relations: TRelation[],
): TSchemaColumn[] {
    if (options.select === undefined) return table.columns;

    const selectColumns = Object.keys(options.select);
    const relationColumns = relations.map(({ columns }) => columns).flat();
    const whereColumns = Object.keys(options.where ?? {});

    return table.columns.filter(column => {
        return selectColumns.includes(column.name) || relationColumns.includes(column.name) || whereColumns.includes(column.name);
    });
}

function filterJoinRelations<T extends TKey> (
    table: TSchemaTable,
    options: Pick<TFindOptions<T>, 'include' | 'where'>,
): TRelation[] {
    const whereKeys = Object.keys(options.where ?? {}).filter(key => table.relations.some(relation => relation.displayTable === key));
    const includeKeys = Object.keys(options.include ?? {});

    return table.relations.filter(({ displayTable, singular }) => {
        if (singular && includeKeys.includes(displayTable)) return true;
        if (whereKeys.includes(displayTable)) return true;
        return false;
    });
}
