import { TSchemaColumn } from '../../types';
import { COLUMN_TYPE } from '../render-column-type';
import { columnDefaults } from '../defaults';

type TString = {
    default?: () => string;
    nullable?: boolean;
};

export default function EnumColumn (name: string, choices: string[], options: TString = {}): TSchemaColumn {
    const size = Math.max(...choices.map(choice => choice.length));
    const errata = choices.map(choice => `'${choice}'`).join(',');

    return columnDefaults({
        ...options,
        name,
        size,
        errata,
        type: COLUMN_TYPE.ENUM
    });
};
