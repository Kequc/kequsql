import { TRelation, TSchemaColumn, TSchemaTable } from '../schema/schema-types';
import { TFindOptions, TStrategy, TWhereOptions } from '../types';
import { TKey } from '../../project/types';

export default function calcStrategy<T extends TKey> (
    table: TSchemaTable,
    options: Pick<TFindOptions<T>, 'include' | 'select' | 'where'>,
    breadcrumb: string[],
    parentTable?: TSchemaTable,
): TStrategy[] {
    const joins = filterJoinRelations(table, options).map(join => calcStrategy(
        join.table,
        getJoinOptions(options, join.displayTable),
        [...breadcrumb, join.displayTable],
        table,
    )).flat();

    const relationKeys = Object.keys(options.include ?? {});
    const relations = table.relations.filter(({ displayTable, singular }) => !singular && relationKeys.includes(displayTable));

    return [{
        table,
        breadcrumb,
        columns: filterColumns(table, options, relations),
        relations,
        parentTable,
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

    return table.columns.filter(column => {
        return selectColumns.includes(column.name) || relationColumns.includes(column.name);
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
