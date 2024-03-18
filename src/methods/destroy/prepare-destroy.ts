import { TSchemaTable } from '@/schema/schema-types';
import { TDestroyManyOptions, TSchemeSql } from '@/types';
import { TKey } from '@project/types';
import { renderSql } from '@/helpers';
import calcStrategy from '../util/calc-strategy';
import renderWhere from '../util/render-where';
import { renderLimit, renderOrderBy } from '../util/helpers';

export default function prepareDestroy<T extends TKey> (
    sql: TSchemeSql,
    table: TSchemaTable,
    options: TDestroyManyOptions<T>
) {
    const strategy = calcStrategy(table, options, []);
    const [whereSql, values] = renderWhere(sql, strategy, options.where);

    const rendered = renderSql(
        `DELETE FROM ${sql.q(table.name)}`,
        whereSql,
        renderOrderBy(sql, options.orderBy),
        renderLimit(options),
    );

    return {
        rendered,
        strategy,
        values,
    };
}
