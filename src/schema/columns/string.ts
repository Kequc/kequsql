import { TSchemaColumn } from '../../types';
import { COLUMN_TYPE } from '../render-column-type';
import { columnDefaults } from '../defaults';

type TString = {
    size?: number;
    default?: () => string;
    nullable?: boolean;
};

export default function stringColumn (name: string, options: TString = {}): TSchemaColumn {
    return columnDefaults({
        ...options,
        name,
        size: options.size ?? 191, // 255?
        type: COLUMN_TYPE.STRING
    });
};
