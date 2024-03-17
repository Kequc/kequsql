import { TConnectionAttrs, TOptions, TQuery, TSchemeConnection } from '../../types';
import devWrapper from "../dev-wrapper";
import queryWrapper from '../query-wrapper';

function loadModule () {
    try {
        return require('mysql2/promise');
    } catch (error) {
        throw new Error('Please install the mysql2 package');
    }
}

export default function mysqlStrategy (conn: TConnectionAttrs, options?: TOptions): TSchemeConnection {
    const mysql = loadModule();
    const pool = devWrapper('mysqlStrategy', () => mysql.createPool({
        user: conn.user,
        password: conn.password,
        host: conn.host,
        port: conn.port,
        database: conn.database,
        waitForConnections: true,
        connectionLimit: options?.connectionLimit ?? 10,
        queueLimit: 0
    }));

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
        transaction
    };
}
