import { TSchemaIndex } from '../../types';

export default function primaryIndex (column: string | string[]): TSchemaIndex {
    const columns = Array.isArray(column) ? column : [column];

    return {
        name: '',
        columns,
        type: 'PRIMARY KEY'
    };
}
