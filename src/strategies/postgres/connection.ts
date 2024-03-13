import { TConnectionAttrs, TOptions, TQuery, TStrategyConnection } from '../../types';
import devWrapper from "../dev-wrapper";
import queryWrapper from '../query-wrapper';

function loadModule () {
    try {
        return require('pg');
    } catch (error) {
        throw new Error('Please install the pg package');
    }
}

export default function postgresStrategy (conn: TConnectionAttrs, options?: TOptions): TStrategyConnection {
    const pg = loadModule();
    const pool = devWrapper('postgresStrategy', () => new pg.Pool({
        user: conn.user,
        password: conn.password,
        host: conn.host,
        port: conn.port,
        database: conn.database,
        max: options?.connectionLimit || 10
    }));

    function buildQuery (query: TQuery) {
        return queryWrapper(async (sql: string, values?: unknown[]): Promise<any> => {
            const { rows } = await query(sql, values) as { rows: unknown[] };
            return rows;
        });
    }

    async function transaction<T = unknown> (cb: (query: TQuery) => Promise<T>): Promise<T> {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');
            const result = await cb(buildQuery(client.query.bind(client)));
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    return {
        query: buildQuery(pool.query.bind(pool)),
        transaction
    };
}
