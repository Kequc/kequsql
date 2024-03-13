import { TSchemaColumn } from '../../types';
import { COLUMN_TYPE } from '../render-column-type';
import { columnDefaults } from '../defaults';

type TDatetime = {
    default?: () => Date;
    auto?: boolean;
    nullable?: boolean;
};

export default function datetimeColumn (name: string, options: TDatetime = {}): TSchemaColumn {
    return columnDefaults({
        ...options,
        name,
        default: options.auto ? () => new Date() : options.default,
        type: COLUMN_TYPE.DATETIME
    });
};
