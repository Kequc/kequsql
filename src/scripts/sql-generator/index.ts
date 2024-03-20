import { TCheckIndex } from '../../dialects/types';
import { getColumns, getIndexName } from '../../schema/schema-parser';
import { TSchemaIndex, TSchemaTable } from '../../schema/types';
import { TClientSql } from '../../types';
import { renderSql } from '../../util/helpers';

export function createIndex (sql: TClientSql, table: TSchemaTable, index: TSchemaIndex) {
    if (sql.dialect === 'postgres' && index.type !== 'primary') {
        return renderSql(
            `CREATE ${renderIndex(sql, table, index)}`,
            `    ON ${sql.q(table.name)}`
        );
    } else {
        return renderSql(
            `ALTER TABLE ${sql.q(table.name)}`,
            `    ADD ${renderIndex(sql, table, index)}`
        );
    }
}

export function dropIndex (sql: TClientSql, table: TSchemaTable, index: TCheckIndex) {
    return renderSql(
        `DROP INDEX ${sql.q(index.name)}`,
        `    ON ${sql.q(table.name)}`
    );
}

export function renderIndex (sql: TClientSql, table: TSchemaTable, index: TSchemaIndex) {
    const columns = getColumns(index.column).map(column => sql.q(column)).join(', ');
    const name = getIndexName(table.name, index.column);

    if (index.type === 'primary') return `PRIMARY KEY (${columns})`;
    if (index.type === 'index') return `INDEX ${sql.q(name)} (${columns})`;
    return `${index.type.toUpperCase()} INDEX ${sql.q(name)} (${columns})`;
}
