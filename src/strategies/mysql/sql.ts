import { TStrategySql } from '../../types';

const sql: TStrategySql = {
    q (value: string) {
        return `\`${value}\``;
    }
};

export default sql;
