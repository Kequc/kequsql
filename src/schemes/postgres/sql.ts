import { TSchemeSql } from '../../types';

const sql: TSchemeSql = {
    q (value: string) {
        return `"${value}"`;
    }
};

export default sql;
