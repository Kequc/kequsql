import { getStrategyConnection, getStrategySql } from './strategies';
import { TInternal, TKequsql, TOptions, TProjTable } from './types';
import { TKey } from '../project/types';
import getSchema from './prep/get-schema';
import getTables from './prep/get-tables';

export default function kequsql(options: TOptions): TKequsql {
    const { scheme, database, query, transaction } = getStrategyConnection(options);

    const internal: TInternal = {
        info: { scheme, database },
        schema: getSchema(options),
        query,
        transaction,
        sql: getStrategySql(scheme),
        getTable<T extends TKey> (name: T): TProjTable<T> {
            return tables[name];
        }
    };

    const tables = getTables(internal);

    return {
        ...tables,
        ...internal
    };
}
