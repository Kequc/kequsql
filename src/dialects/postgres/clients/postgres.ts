import { TClient, TQuery } from '@/types';
import queryWrapper from '../../query-wrapper';
import devWrapper from '../../dev-wrapper';
import sql from '../sql';

// TODO: I haven't actually checked the implementation

// USAGE:
// import postgres from "postgres";
// import { kequsql, postgresClient } from "kequsql";
//
// const client = postgresClient(() => {
//     return postgres("postgres://postgres:adminadmin@0.0.0.0:5432/db");
// });
//
// const db = kequsql(client, { ... });

export default function postgresClient (getConn: () => any, name = 'dbConn'): TClient {
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
