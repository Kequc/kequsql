import mysqlCheck from './mysql/check';
import postgresCheck from './postgres/check';
import mysqlConnection from './mysql/connection';
import postgresConnection from './postgres/connection';
import mysqlSql from './mysql/sql';
import postgresSql from './postgres/sql';
import { TInternal, TOptions, TSchemaTable, TScheme, TStrategySql } from '../types';
import getConnectionAttrs from './get-connection-attrs';

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

export function getStrategyConnection (options: TOptions) {
    const connectionAttrs = getConnectionAttrs(options.connection);
    const { scheme, database } = connectionAttrs;
    if (!(scheme in SCHEMES)) throw new Error(`No strategy found for: ${scheme}`);
    const connection = SCHEMES[scheme].connection(connectionAttrs);
    return { ...connection, scheme, database };
}

export function getStrategySql (scheme: TScheme) {
    if (!(scheme in SCHEMES)) throw new Error(`No strategy found for: ${scheme}`);
    return SCHEMES[scheme].sql as TStrategySql;
}
