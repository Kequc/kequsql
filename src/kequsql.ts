import { getStrategyConnection, getStrategySql } from './strategies';
import { TInternal, TKequsql, TOptions, TProjTable } from './types';
import { TKey } from '../project/types';
import getConnectionAttrs from './prep/get-connection-attrs';
import getSchema from './prep/get-schema';
import getTables from './prep/get-tables';

export default function kequsql (options: TOptions): TKequsql {
    const connectionAttrs = getConnectionAttrs(options.connection);
    const { scheme, database } = connectionAttrs;
    const { query, transaction } = getStrategyConnection(connectionAttrs);

    const internal: TInternal = {
        info: { scheme, database },
        query,
        transaction,
        schema: getSchema(options),
        sql: getStrategySql(scheme),
        getTable<T extends TKey> (name: T): TProjTable<T> {
            return tables[name];
        },
    };

    const tables = getTables(internal);

    return {
        ...tables,
        ...internal,
    };
}
