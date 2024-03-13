import { TSchemaColumn } from '../../types';
import { COLUMN_TYPE } from '../render-column-type';
import { columnDefaults } from '../defaults';

type TInteger = {
    default?: () => number;
    unsigned?: boolean;
    nullable?: boolean;
    increment?: boolean;
};

export default function integerColumn (name: string, options: TInteger = {}): TSchemaColumn {
    return columnDefaults({
        ...options,
        name,
        type: COLUMN_TYPE.INTEGER
    });
};
