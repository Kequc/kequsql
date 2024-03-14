import mysqlCheck from './mysql/check';
import postgresCheck from './postgres/check';
import mysqlConnection from './mysql/connection';
import postgresConnection from './postgres/connection';
import mysqlSql from './mysql/sql';
import postgresSql from './postgres/sql';
import { TConnectionAttrs, TInternal, TOptions, TSchemaTable, TScheme, TStrategySql } from '../types';
import getConnectionAttrs from '../prep/get-connection-attrs';

const SCHEMES = {
    mysql: {
        check: mysqlCheck,
        connection: mysqlConnection,
        sql: mysqlSql
    },
    postgres: {
        check: postgresCheck,
        connection: postgresConnection,
        sql: postgresSql
    }
};

export function checkTables (internal: TInternal) {
    const scheme = internal.info.scheme;
    if (!(scheme in SCHEMES)) throw new Error(`No strategy found for: ${scheme}`);
    return SCHEMES[scheme].check(internal) as Promise<TSchemaTable[]>;
}

export function getStrategyConnection (connectionAttrs: TConnectionAttrs) {
    const scheme = connectionAttrs.scheme;
    if (!(scheme in SCHEMES)) throw new Error(`No strategy found for: ${scheme}`);
    return SCHEMES[scheme].connection(connectionAttrs);
}

export function getStrategySql (scheme: TScheme) {
    if (!(scheme in SCHEMES)) throw new Error(`No strategy found for: ${scheme}`);
    return SCHEMES[scheme].sql as TStrategySql;
}
