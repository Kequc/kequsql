import { renderSql } from '@/helpers';
import { TKey } from '@project/types';
import { TSchemaTable } from '@/schema/schema-types';
import { TFindManyOptions, TInternal } from '@/types';
import { renderWhere } from '../util/render-where';
import { renderLimit, renderOrderBy, renderSelect } from './helpers';
import calcStrategy from '../util/calc-strategy';
import renderFrom from '../util/render-from';

export default function prepareFind<T extends TKey> (
    db: TInternal,
    table: TSchemaTable,
    options: TFindManyOptions<T>,
) {
    const strategy = calcStrategy(table, options, []);
    const [whereSql, values] = renderWhere(db.sql, strategy, options.where);

    const rendered = renderSql(
        `SELECT ${renderSelect(db.sql, strategy)}`,
        ...renderFrom(db.sql, strategy),
        whereSql,
        renderOrderBy(db.sql, options.orderBy),
        renderLimit(options),
    );

    return {
        rendered,
        strategy,
        values
    };
}
