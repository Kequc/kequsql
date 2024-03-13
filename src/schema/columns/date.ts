import { TSchemaColumn } from '../../types';
import { COLUMN_TYPE } from '../render-column-type';
import { columnDefaults } from '../defaults';

type TDate = {
    default?: () => Date;
    auto?: boolean;
    nullable?: boolean;
};

export default function dateColumn (name: string, options: TDate = {}): TSchemaColumn {
    return columnDefaults({
        ...options,
        name,
        default: options.auto ? () => new Date() : options.default,
        type: COLUMN_TYPE.DATE
    });
};
