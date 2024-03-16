import { TSchemaTable, TSchemeSql, TWhereOptions } from '../../../project/types';
import { isPojo } from '../../util/helpers';

const OPERATOR_KEYS = ['or', 'and'];

export function renderWhere (sql: TSchemeSql, table: TSchemaTable, where?: TWhereOptions<any>): [string, unknown[]] {
    if (where === undefined) return ['', []];

    const result: string[] = [];
    const values: unknown[] = [];

    for (const column of table.columns) {
        const key = column.name;
        if (where[key] === undefined) continue;

        if (isPojo(where[key])) {
            for (const [operator, value] of Object.entries(where[key])) {
                const notArray = !Array.isArray(value) || value.length === 0;

                if (operator === 'in' && notArray) {
                    // null condition
                    result.push('1 = ?');
                    values.push(0);
                    continue;
                }
                if (operator === 'notIn' && notArray) {
                    // ignore condition
                    continue;
                }

                result.push(withOperator(sql, operator, column.name));
                if (operator === 'isNull' || operator === 'isNotNull') continue;
                values.push(value);
            }
        } else {
            result.push(`${sql.q(column.name)} = ?`);
            values.push(where[key]);
        }
    }

    for (const key of OPERATOR_KEYS) {
        if (Array.isArray(where[key]) && where[key].every(isPojo)) {
            const wheres = where[key] as TWhereOptions<any>[];
            const operator = key === 'or' ? ' OR ' : ' AND ';
            const [r, v] = mapPairs(sql, table, wheres, operator);
            result.push(r);
            values.push(...v);
        }
    }

    return [
        result.join(' AND '),
        values
    ];
}

function mapPairs (
    sql: TSchemeSql,
    table: TSchemaTable,
    wheres: TWhereOptions<any>[],
    operator: string
): [string, unknown[]] {
    const result: string[] = [];
    const values: unknown[] = [];
    const pairs = wheres.map(where => renderWhere(sql, table, where));

    for (const [r, v] of pairs) {
        result.push(`(${r})`);
        values.push(...v);
    }

    return [`(${result.join(operator)})`, values];
}

function withOperator (sql: TSchemeSql, operator: string, name: string) {
    switch (operator) {
        case 'in': return `${sql.q(name)} IN (?)`;
        case 'notIn': return `${sql.q(name)} NOT IN (?)`;
        case 'lt': return `${sql.q(name)} < ?`;
        case 'lte': return `${sql.q(name)} <= ?`;
        case 'gt': return `${sql.q(name)} > ?`;
        case 'gte': return `${sql.q(name)} >= ?`;
        case 'ne': return `${sql.q(name)} != ?`;
        case 'like': return `${sql.q(name)} LIKE ?`;
        case 'notLike': return `${sql.q(name)} NOT LIKE ?`;
        case 'isNull': return `${sql.q(name)} IS NULL`;
        case 'isNotNull': return `${sql.q(name)} IS NOT NULL`;
    }

    throw new Error(`Unknown operator: ${operator} for column: ${name}`);
}
