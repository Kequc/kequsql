import { TQuery } from '@/types';

export default function queryWrapper (performQuery: TQuery) {
    return async function query<T = unknown> (sql: string, values?: unknown[], silent?: boolean) {
        const startedAt = Date.now();
        let rows: T;

        try {
            rows = await performQuery(sql, values) as T;
        } catch (error) {
            console.error(error);
            throw error;
        }

        if (!silent) {
            console.log('\n' + sql);
            console.log(Array.isArray(rows) ? rows.length : 0, 'rows', Date.now() - startedAt, 'ms');
        }

        return rows;
    }
}
