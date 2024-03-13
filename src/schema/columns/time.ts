import { TSchemaColumn } from '../../types';
import { COLUMN_TYPE } from '../render-column-type';
import { columnDefaults } from '../defaults';

type TTime = {
    default?: () => Date;
    auto?: boolean;
    nullable?: boolean;
};

export default function timeColumn (name: string, options: TTime = {}): TSchemaColumn {
    return columnDefaults({
        ...options,
        name,
        default: options.auto ? () => new Date() : options.default,
        type: COLUMN_TYPE.TIME
    });
};
