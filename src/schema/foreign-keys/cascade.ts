import { TSchemaForeignKey } from '../../types';
import { getDisplayTable } from '../../helpers';
import { validateColumns } from './util/helpers';
import { TKey } from '../../index';

export default function cascadeForeignKey (table: string, id: string | string[], column: string | string[]): TSchemaForeignKey {
    const columns = Array.isArray(column) ? column : [column];
    const ids = Array.isArray(id) ? id : [id];
    validateColumns(columns, ids);

    return {
        name: '',
        table: table as TKey,
        displayTable: getDisplayTable(table),
        columns,
        ids,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    };
}
