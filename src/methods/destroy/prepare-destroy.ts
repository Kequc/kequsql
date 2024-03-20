import { TSchemaTable } from '../../schema/types';
import { TDestroyManyOptions, TClientSql } from '../../types';
import { TKey } from '../../../project/types';
import { renderSql } from '../../util/helpers';
import calcStrategy from '../../util/calc-strategy';
import renderWhere from '../../util/render-where';
import { renderLimit, renderOrderBy } from '../../util/render-etc';

export default function prepareDestroy<T extends TKey> (
    sql: TClientSql,
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
