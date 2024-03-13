import { TSchemaIndex } from '../../types';

export default function uniqueIndex (column: string | string[]): TSchemaIndex {
    const columns = Array.isArray(column) ? column : [column];

    return {
        name: '',
        columns,
        type: 'UNIQUE'
    };
}
