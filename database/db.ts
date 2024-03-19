import 'dotenv/config';
import mysql2 from 'mysql2/promise';
import { kequsql, mysql2Client } from '../src/index';
import schema from './schema';

const client = mysql2Client(() => {
    return mysql2.createPool(process.env.DATABASE_URL!);
});

const db = kequsql(client, { schema });

export default db;
