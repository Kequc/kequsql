import { TSchemaColumn } from '../../types';
import { COLUMN_TYPE } from '../render-column-type';
import { columnDefaults } from '../defaults';

type TString = {
    size?: 'medium' | 'long' | number;
    default?: () => string;
    nullable?: boolean;
};

export default function textColumn (name: string, options: TString = {}): TSchemaColumn {
    return columnDefaults({
        ...options,
        name,
        size: typeof options.size === 'number' ? options.size : undefined,
        errata: typeof options.size === 'string' ? options.size : undefined,
        type: COLUMN_TYPE.TEXT
    });
};
