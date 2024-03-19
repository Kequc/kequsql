import { randomUUID } from 'crypto';
import { renderSql } from '@/util/helpers';
import { TKey } from '@project/types';
import { TRelation, TSchemaColumn, TSchemaTable } from '@/schema/schema-types';
import { TCreateManyOptions, TInternal, TRow } from '@/types';

const BATCH_SIZE = 200;

export default function prepareCreate<T extends TKey> (
    db: TInternal,
    table: TSchemaTable,
    options: TCreateManyOptions<T>,
) {
    // calculate number of batches i need
    const batchCount = Math.ceil(options.data.length / BATCH_SIZE);
    // split data up into batches
    const batches = new Array(batchCount).fill(0).map((_, i) => options.data.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE));

    const [columns, relations] = filterColumns(table, options.data as TRow[]);
    const values3 = batches.map(data => getValuesWithDefault(columns, data as TRow[]));
    const columnsSql = columns.map(({ name }) => db.sql.q(name)).join(', ');
    const unique = (table.returnStrategy.unique ?? []).map(name => columns.findIndex(column => column.name === name));

    const rendered = renderSql(
        `INSERT INTO ${db.sql.q(table.name)} (${columnsSql})`,
        `VALUES ?`
    );

    return {
        rendered,
        relations,
        values3,
        unique,
    };
}

function filterColumns (table: TSchemaTable, data: TRow[] = []): [TSchemaColumn[], TRelation[]] {
    const columns = new Set<TSchemaColumn>();
    const relations = new Set<TRelation>();

    for (const row of data) {
        for (const column of table.columns) {
            if (row[column.name] !== undefined || hasDefault(column)) columns.add(column);
        }
        for (const relation of table.relations) {
            if (row[relation.displayTable] !== undefined) relations.add(relation);
        }
    }

    return [[...columns], [...relations]];
}

function hasDefault (column: TSchemaColumn) {
    return !!getValueAuto(column);
}

function getValuesWithDefault (columns: TSchemaColumn[], data: TRow[]): TRow[][] {
    return data.map(row => columns.map(column => getValue(column, row[column.name])));
}

function getValue (column: TSchemaColumn, value: any) {
    if (value !== undefined) return value;
    const valueAuto = getValueAuto(column);
    if (valueAuto) return valueAuto;
    if (column.default instanceof Function) return column.default();

    return null;
}

function getValueAuto (column: TSchemaColumn) {
    if (!('auto' in column) || column.auto !== true) return undefined;
    switch (column.type) {
        case 'date':
        case 'datetime':
        case 'time':
            return new Date();
        case 'uuid':
            return randomUUID();
        default:
            return undefined;
    }
}
