import { TClient, TQuery } from '../../../types';
import queryWrapper from '../../query-wrapper';
import devWrapper from '../../dev-wrapper';
import sql from '../sql';

// USAGE:
// import pg from "pg";
// import { kequsql, pgClient } from "kequsql";
//
// const client = pgClient(() => {
//     return new pg.Pool({
//         host: "host",
//         user: "user",
//         database: "database",
//         ...
//     });
// });
//
// const db = kequsql(client, { ... });

export default function pgClient (getConn: () => any, name = 'dbConn'): TClient {
    const pool = devWrapper(name, getConn);

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
        transaction,
        sql,
    };
}
