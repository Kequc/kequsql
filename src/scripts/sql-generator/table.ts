import { renderIndex } from '.';
import { TCheckTable } from '../../dialects/types';
import { TSchemaTable } from '../../schema/types';
import { TClientSql } from '../../types';
import { renderSql } from '../../util/helpers';
import { renderColumn } from './column';

export function createTable (sql: TClientSql, table: TSchemaTable) {
    const name = table.name;
    const rendered = [
        ...table.columns.map(column => '    ' + renderColumn(sql, table, column)),
        ...table.indexes.map(index => '    ' + renderIndex(sql, table, index))
    ].join(',\n');

    return renderSql(`CREATE TABLE ${sql.q(name)} (`, rendered, ')');
}

export function dropTable (sql: TClientSql, table: TCheckTable) {
    return `DROP TABLE ${sql.q(table.name)};`;
}
