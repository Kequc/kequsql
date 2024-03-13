import { TOrderOptions, TStrategySql } from '../../../project/types';

export function renderOrder (sql: TStrategySql, order: TOrderOptions<any> = {}) {
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
