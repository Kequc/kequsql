import { TKey, TTable } from '../../project/private-types';
import { TCreateManyOptions, TRelation, TSchemaColumn, TSchemaTable, TSchemeSql } from '../../project/types';
import { renderSql } from '../util/helpers';

const BATCH_SIZE = 200;

export default function prepareCreate<T extends TKey> (
    sql: TSchemeSql,
    table: TSchemaTable,
    options: TCreateManyOptions<T>
) {
    // calculate number of batches i need
    const batchCount = Math.ceil(options.data.length / BATCH_SIZE);
    // split data up into batches
    const batches = new Array(batchCount).fill(0).map((_, i) => options.data.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE));
    const [columns, relations] = filterColumns(table, options.data);
    const batchData = batches.map(batchData => getDataWithDefault(columns, batchData));
    const batchValues = batchData.map(data => columnsToValues(columns, data));
    const columnsSql = columns.map(({ name }) => sql.q(name)).join(', ');

    const result = renderSql(
        `INSERT INTO ${sql.q(table.name)} (${columnsSql})`,
        `VALUES ?`
    );

    return {
        sql: result,
        columns,
        batches,
        batchData,
        relations,
        batchValues
    };
}

function filterColumns (table: TSchemaTable, data: Partial<TTable<any>>[] = []): [TSchemaColumn[], TRelation[]] {
    const c = new Set<TSchemaColumn>(table.columns.filter(column => !!column.default));
    const r = new Set<TRelation>();

    for (const row of data) {
        for (const column of table.columns) {
            if (row[column.name] !== undefined) c.add(column);
        }
        for (const relation of table.relations) {
            if (row[relation.displayTable] !== undefined) r.add(relation);
        }
    }

    return [[...c], [...r]];
}

function getDataWithDefault (columns: TSchemaColumn[], data: Partial<TTable<any>>[]): Partial<TTable<any>>[] {
    return data.map(row => {
        const result: Partial<TTable<any>> = {};

        for (const column of columns) {
            const key = column.name;
            result[key] = getValue(column, row[key]);
        }

        return result;
    });
}

function getValue (column: TSchemaColumn, value: any) {
    if (value !== undefined) return value;
    if (column.default instanceof Function) return column.default();

    return undefined;
}

function columnsToValues (columns: TSchemaColumn[], columnsData: Partial<TTable<any>>[] = []) {
    const result: any[][] = [];

    for (let i = 0; i < columnsData.length; i++) {
        result[i] = columns.map(column => columnsData[i][column.name]);
    }

    return result;
}
