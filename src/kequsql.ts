import { TClient, TInternal, TKequsql, TOptions, TProjTable } from './types';
import { TKey } from '../project/types';
import getSchema from './schema/get-schema';
import getTables from './schema/get-tables';

export default function kequsql (client: TClient, options: TOptions): TKequsql {
    const internal: TInternal = {
        ...client,
        schema: getSchema(options),
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
