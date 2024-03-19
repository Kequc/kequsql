import { TOrderByOptions, TClientSql, TStrategy } from '../types';
import { zipper } from '../util/helpers';

const DIRECTION = {
    asc: 'ASC',
    desc: 'DESC',
};

export function renderOrderBy (sql: TClientSql, order: TOrderByOptions<any> = {}) {
    const result: string[] = [];

    for (const [name, direction] of Object.entries(order)) {
        result.push(`t0.${sql.q(name)} ${DIRECTION[direction]}`);
    }

    return result.length === 0 ? '' : `ORDER BY ${result.join(', ')}`;
}

export function renderLimit ({ limit, offset }: { limit?: number, offset?: number }) {
    if (limit === undefined) return '';
    if (offset !== undefined) return `LIMIT ${limit} OFFSET ${offset}`;
    return `LIMIT ${limit}`;
}

export function renderSelect (
    sql: TClientSql,
    strategy: TStrategy[],
): string {
    return strategy.map(({ columns }, index) => {
        return columns.map(({ name }, i) => `t${index}.${sql.q(name)} t${index}_${i}`);
    }).flat().join(', ');
}

export function renderFrom (
    sql: TClientSql,
    strategy: TStrategy[],
    skipFirst = false,
): string[] {
    const result: string[] = [];

    for (let index = 0; index < strategy.length; index++) {
        if (index === 0 && skipFirst) continue;
        const { table, parentTable } = strategy[index];
        const command = result.length < 1 ? 'FROM' : 'LEFT JOIN';
        result.push(`${command} ${sql.q(table.name)} t${index}`);
        if (parentTable === undefined) continue;
        result.push(renderOn(sql, strategy, index));
    }

    return result;
}

function renderOn (
    sql: TClientSql,
    strategy: TStrategy[],
    index: number,
): string {
    const { table, parentTable } = strategy[index];
    const relation = table.relations.find(({ table }) => table === parentTable);
    const parentIndex = strategy.findIndex(({ table }) => table === parentTable);

    const result = zipper(
        [relation.columns, relation.ids],
        (column, id) => `t${parentIndex}.${sql.q(id)} = t${index}.${sql.q(column)}`,
    );

    return 'ON ' + result.join(' AND ');
}
