import { TClient, TQuery } from '../../../types';
import queryWrapper from '../../query-wrapper';
import devWrapper from '../../dev-wrapper';
import sql from '../sql';

// USAGE:
// import mysql2 from "mysql2/promise";
// import { kequsql, mysql2Client } from "kequsql";
//
// const client = mysql2Client(() => {
//     return mysql2.createPool(process.env.DATABASE_URL!);
// });
//
// const db = kequsql(client, { ... });

export default function mysql2Client (getConn: () => any, name = 'dbConn'): TClient {
    const pool = devWrapper(name, getConn);

    function buildQuery (query: TQuery) {
        return queryWrapper(async (sql: string, values?: unknown[]): Promise<any> => {
            const [rows] = await query(sql, values) as unknown[];
            return rows;
        });
    }

    async function transaction<T = unknown> (cb: (query: TQuery) => Promise<T>): Promise<T> {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const result = await cb(buildQuery(connection.query.bind(connection)));
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    return {
        query: buildQuery(pool.query.bind(pool)),
        transaction,
        sql,
    };
}
