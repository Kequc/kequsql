import { TClientSql } from '@/types';

const sql: TClientSql = {
    scheme: 'postgres',
    q (value: string) {
        return `"${value}"`;
    }
};

export default sql;
