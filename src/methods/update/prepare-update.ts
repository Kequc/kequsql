import { renderSql } from '../../util/helpers';
import { TKey } from '../../../project/types';
import { TSchemaTable } from '../../schema/types';
import { TInternal, TRow, TClientSql, TStrategy, TUpdateManyOptions } from '../../types';
import calcStrategy from '../../util/calc-strategy';
import renderWhere from '../../util/render-where';
import { renderFrom } from '../../util/render-etc';

export default function prepareUpdate<T extends TKey> (
    db: TInternal,
    table: TSchemaTable,
    options: TUpdateManyOptions<T>,
) {
    return options.changes.map(change => {
        const strategy = calcStrategy(table, change, []);
        const [setSql, setValues] = renderSet(db.sql, table, change.data as TRow);
        const [whereSql, whereValues] = renderWhere(db.sql, strategy, change.where);

        const rendered = renderDialectSql(
            db,
            table,
            strategy,
            setSql,
            whereSql,
        );

        return {
            rendered,
            strategy,
            values: [...setValues, ...whereValues],
        };
    });
}

function renderDialectSql (
    db: TInternal,
    table: TSchemaTable,
    strategy: TStrategy[],
    setSql: string,
    whereSql: string,
) {
    switch (db.sql.dialect) {
        case 'mysql': return renderSql(
            `UPDATE ${db.sql.q(table.name)} t0`,
            ...renderFrom(db.sql, strategy).slice(1),
            setSql,
            whereSql,
        );
        case 'postgres': renderSql(
            `UPDATE ${db.sql.q(table.name)} t0`,
            setSql,
            ...renderFrom(db.sql, strategy, true),
            whereSql,
        );
        default:
            throw new Error(`Unknown dialect: ${db.sql.dialect}`);
    }
}

function renderSet (
    sql: TClientSql,
    table: TSchemaTable,
    data: TRow,
): [string, unknown[]]{
    const setSqlArr: string[] = [];
    const values: unknown[] = [];

    for (const column of table.columns) {
        if (data[column.name] === undefined) continue;
        setSqlArr.push(`t0.${sql.q(column.name)} = ?`);
        values.push(data[column.name]);
    }

    return ['SET ' + setSqlArr.join(', '), values];
}
