import { TKey } from '../../project/private-types';
import { TDestroyManyOptions, TSchemaTable, TSchemeSql } from '../../project/types';
import { renderSql } from '../util/helpers';
import { renderWhere } from './util/render-where';
import { renderLimit, renderOrder } from './find/helpers';

export default function prepareDestroy<T extends TKey> (
    sql: TSchemeSql,
    table: TSchemaTable,
    options: TDestroyManyOptions<T>
) {
    const [whereSql, values] = renderWhere(sql, table, options.where);

    const result = renderSql(
        `DELETE FROM ${sql.q(table.name)}`,
        whereSql ? `WHERE ${whereSql}` : '',
        renderOrder(sql, options.order),
        renderLimit(options)
    );

    return {
        sql: result,
        values
    };
}
