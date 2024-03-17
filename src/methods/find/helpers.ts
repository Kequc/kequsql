import { zipper } from '../../helpers';
import { TOrderOptions, TSchemeSql, TStrategy } from '../../types';

export function renderOrderBy (sql: TSchemeSql, order: TOrderOptions<any> = {}) {
    const result: string[] = [];

    for (const [name, value] of Object.entries(order)) {
        result.push(`${sql.q(name)} ${value}`);
    }

    return result.length === 0 ? '' : `ORDER BY ${result.join(', ')}`;
}

export function renderLimit ({ limit, offset }: { limit?: number, offset?: number }) {
    if (limit === undefined) return '';
    if (offset !== undefined) return `LIMIT ${limit} OFFSET ${offset}`;
    return `LIMIT ${limit}`;
}

export function renderSelect (
    sql: TSchemeSql,
    strategy: TStrategy[],
): string {
    return strategy.map(({ columns }, index) => {
        return columns.map(({ name }, i) => `t${index}.${sql.q(name)} t${index}_${i}`);
    }).flat().join(', ');
}

export function renderFrom (
    sql: TSchemeSql,
    strategy: TStrategy[],
): string[] {
    const result: string[] = [];

    for (let index = 0; index < strategy.length; index++) {
        const { table } = strategy[index];
        const command = index === 0 ? 'FROM' : 'JOIN';
        result.push(`${command} ${sql.q(table.name)} t${index}`);
        if (index === 0) continue;
        result.push(renderOn(sql, strategy, index));
    }

    return result;
}

function renderOn (
    sql: TSchemeSql,
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
