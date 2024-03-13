import { TRelation, TSchemaColumn, TSchemaTable, TStrategySql, TWaiting } from '../../project/types';
import { renderWhere } from '../methods/util/render-where';
import { renderSql } from '../util/helpers';
import reduceWheres from '../methods/util/reduce-wheres';
import { renderLimit, renderOrder } from '../methods/util/select-helpers';

export type TPrepareFindResult = {
    rendered: string;
    columns: TSchemaColumn[];
    relations: TRelation[];
    values: unknown[];
};

export default function prepareFind (
    sql: TStrategySql,
    batch: TWaiting[],
    table: TSchemaTable
): TPrepareFindResult {
    const columns = filterColumns(batch, table);
    const relations = filterRelations(batch, table);
    const necessaryColumns = findNecessaryColumns(batch, table, columns, relations);
    const [whereSql, values] = renderWhere(sql, table, reduceWheres(batch.map(({ where }) => where)));

    const rendered = renderSql(
        `SELECT ${renderSelect(sql, necessaryColumns)}`,
        `FROM ${sql.q(table.name)}`,
        whereSql ? `WHERE ${whereSql}` : '',
        batch.length === 1 ? renderOrder(sql, batch[0].order) : '',
        batch.length === 1 ? renderLimit(batch[0]) : ''
    );

    return {
        rendered,
        columns,
        relations,
        values
    };
}

function findNecessaryColumns (batch: TWaiting[], table: TSchemaTable, columns: TSchemaColumn[], relations: TRelation[]): TSchemaColumn[] {
    const relationColumns = relations.map(relation => relation.columns).flat();
    const whereColumns = batch.map(({ where }) => Object.keys(where ?? {})).flat();

    return table.columns.filter(column => {
        return columns.includes(column) || relationColumns.includes(column.name) || whereColumns.includes(column.name);
    });
}

function filterColumns (batch: TWaiting[], table: TSchemaTable): TSchemaColumn[] {
    const select = batch[0].select;
    if (select === undefined) return table.columns;

    const result: TSchemaColumn[] = [];

    for (const column of table.columns) {
        if (select[column.name] !== undefined) result.push(column);
    }

    return result;
}

function filterRelations (batch: TWaiting[], table: TSchemaTable) {
    const include = [...new Set(
        batch.map(({ include }) => Object.keys(include ?? {})).flat()
    )];

    return table.relations.filter(relation => include.includes(relation.displayTable));
}

function renderSelect (
    sql: TStrategySql,
    columns: TSchemaColumn[]
): string {
    if (columns.length === 0) return '*';
    return columns.map(({ name }) => sql.q(name)).join(', ');
}
