import { randomUUID } from 'crypto';
import { TSchemaColumn } from '../../types';
import { columnDefaults } from '../defaults';
import { COLUMN_TYPE } from '../render-column-type';

type TUuid = {
    default?: () => string;
    auto?: boolean;
    nullable?: boolean;
};

export default function uuidColumn (name: string, options: TUuid = {}): TSchemaColumn {
    return columnDefaults({
        ...options,
        name,
        default: options.auto ? () => randomUUID() : options.default,
        type: COLUMN_TYPE.UUID
    });
};
