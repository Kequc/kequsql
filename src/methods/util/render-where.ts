import { TSchemeSql, TStrategy, TWhereOptions } from '../../types';
import { dig, isPojo } from '../../helpers';

const OPERATOR_KEYS = ['or', 'and'];

export default function renderWhere (
    sql: TSchemeSql,
    strategy: TStrategy[],
    where?: TWhereOptions<any>,
): [string, unknown[]] {
    if (where === undefined) return ['', []];

    const result: string[] = [];
    const values: unknown[] = [];

    for (let i = 0; i < strategy.length; i++) {
        const { table, breadcrumb } = strategy[i];

        for (const column of table.columns) {
            const key = column.name;
            const value = dig(where, [...breadcrumb, key]);
            if (value === undefined) continue;

            if (isPojo(value)) {
                for (const [operator, subValue] of Object.entries(value)) {
                    const notArray = !Array.isArray(subValue) || subValue.length === 0;

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
                    values.push(subValue);
                }
            } else {
                result.push(`t${i}.${sql.q(column.name)} = ?`);
                values.push(value);
            }
        }

        for (const key of OPERATOR_KEYS) {
            const value = dig(where, [...breadcrumb, key]);

            if (Array.isArray(value) && value.every(isPojo)) {
                const wheres = value as TWhereOptions<any>[];
                const operator = key === 'or' ? ' OR ' : ' AND ';
                const [r, v] = mapPairs(sql, strategy, wheres, operator);
                result.push(r);
                values.push(...v);
            }
        }
    }

    if (result.length === 0) return ['', []];

    return [
        'WHERE ' + result.join(' AND '),
        values
    ];
}

function mapPairs (
    sql: TSchemeSql,
    strategy: TStrategy[],
    wheres: TWhereOptions<any>[],
    operator: string
): [string, unknown[]] {
    const result: string[] = [];
    const values: unknown[] = [];
    const pairs = wheres.map(where => renderWhere(sql, strategy, where));

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
