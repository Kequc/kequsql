import { zipper } from '@/helpers';
import { TOrderByOptions, TSchemeSql, TStrategy } from '@/types';

const DIRECTION = {
    asc: 'ASC',
    desc: 'DESC',
};

export function renderOrderBy (sql: TSchemeSql, order: TOrderByOptions<any> = {}) {
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
    sql: TSchemeSql,
    strategy: TStrategy[],
): string {
    return strategy.map(({ columns }, index) => {
        return columns.map(({ name }, i) => `t${index}.${sql.q(name)} t${index}_${i}`);
    }).flat().join(', ');
}
