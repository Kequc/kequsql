import { TKey, TTable } from '../../project/private-types';
import { TSchemaColumn, TSchemaTable, TSchemeSql, TUpdateOptions } from '../../project/types';
import { renderSql } from '../util/helpers';
import { renderWhere } from './util/render-where';

export default function prepareUpdate<T extends TKey> (
    sql: TSchemeSql,
    table: TSchemaTable,
    options: TUpdateOptions<T>
) {
    const columns = filterColumns(table.columns, options.data);

    if (columns.length < 1) return {
        sql: '',
        columns: [],
        values: []
    };

    const [setSql, setValues] = renderSet(sql, columns, options.data);
    const [whereSql, whereValues] = renderWhere(sql, table, options.where);

    const result = renderSql(
        `UPDATE ${sql.q(table.name)}`,
        `SET ${setSql}`,
        whereSql ? `WHERE ${whereSql}` : ''
    );

    return {
        sql: result,
        columns,
        values: [...setValues, ...whereValues]
    };
}

function filterColumns (columns: TSchemaColumn[], data: Partial<TTable<any>>) {
    return columns.filter(column => data[column.name] !== undefined);
}

function renderSet (sql: TSchemeSql, columns: TSchemaColumn[], data: Partial<TTable<any>>) {
    const setSql = columns.map(column => `${sql.q(column.name)} = ?`).join(', ');
    const values = columns.map(column => data[column.name]);

    return [setSql, values];
}
