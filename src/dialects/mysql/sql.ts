import { TClientSql } from '@/types';

const sql: TClientSql = {
    scheme: 'mysql',
    q: (value: string) => `\`${value}\``,
};

export default sql;
