import { TQuery } from '../types';
import { loadConfig } from '../util/load-file';

export default function queryWrapper (performQuery: TQuery) {
    return async function query<T = unknown> (sql: string, values?: unknown[], silent?: boolean) {
        const config = await loadConfig();
        const startedAt = Date.now();
        let rows: T;

        try {
            rows = await performQuery(sql, values) as T;
        } catch (error) {
            console.error(error);
            throw error;
        }

        if (!silent && !config.silent) {
            console.log('\n' + sql);
            console.log(Array.isArray(rows) ? rows.length : 0, 'rows', Date.now() - startedAt, 'ms');
        }

        return rows;
    }
}
