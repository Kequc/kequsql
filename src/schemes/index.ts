import mysqlCheck from './mysql/check';
import postgresCheck from './postgres/check';
import mysqlConnection from './mysql/connection';
import postgresConnection from './postgres/connection';
import mysqlSql from './mysql/sql';
import postgresSql from './postgres/sql';
import { TConnectionAttrs, TInternal, TScheme, TSchemeSql } from '../types';
import { TSchemaTable } from '../schema/schema-types';

const SCHEMES = {
    mysql: {
        check: mysqlCheck,
        connection: mysqlConnection,
        sql: mysqlSql,
    },
    postgres: {
        check: postgresCheck,
        connection: postgresConnection,
        sql: postgresSql,
    },
};

export function checkTables (internal: TInternal) {
    const scheme = internal.info.scheme;
    if (!(scheme in SCHEMES)) throw new Error(`No scheme found for: ${scheme}`);
    return SCHEMES[scheme].check(internal) as Promise<TSchemaTable[]>;
}

export function getSchemeConnection (connectionAttrs: TConnectionAttrs) {
    const scheme = connectionAttrs.scheme;
    if (!(scheme in SCHEMES)) throw new Error(`No scheme found for: ${scheme}`);
    return SCHEMES[scheme].connection(connectionAttrs);
}

export function getSchemeSql (scheme: TScheme) {
    if (!(scheme in SCHEMES)) throw new Error(`No scheme found for: ${scheme}`);
    return SCHEMES[scheme].sql as TSchemeSql;
}
