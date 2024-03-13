import { TSchemaColumn } from '../../types';
import { COLUMN_TYPE } from '../render-column-type';
import { columnDefaults } from '../defaults';

type TBoolean = {
    default?: () => boolean;
    nullable?: boolean;
};

export default function booleanColumn (name: string, options: TBoolean = {}): TSchemaColumn {
    return columnDefaults({
        ...options,
        name,
        type: COLUMN_TYPE.BOOLEAN
    });
};
