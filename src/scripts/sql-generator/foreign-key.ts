import { renderSql } from '../../util/helpers';
import { getColumns, getForeignKeyName, getForeignKeyonDelete, getForeignKeyonUpdate, getIds } from '../../schema/schema-parser';
import { TSchemaForeignKey, TSchemaTable } from '../../schema/types';
import { TClientSql } from '../../types';
import { TCheckForeignKey } from '../../dialects/types';

export function createForeignKey (sql: TClientSql, table: TSchemaTable, foreignKey: TSchemaForeignKey) {
    const columns = getColumns(foreignKey.column).map(column => sql.q(column)).join(', ');
    const ids = getIds(foreignKey.id).map(id => sql.q(id)).join(', ');
    const name = getForeignKeyName(table.name, foreignKey);

    return renderSql(
        `ALTER TABLE ${sql.q(table.name)}`,
        `    ADD CONSTRAINT ${name}`,
        `        FOREIGN KEY (${columns})`,
        `        REFERENCES ${sql.q(foreignKey.table)} (${ids})`,
        `        ON UPDATE ${getForeignKeyonUpdate(foreignKey).toUpperCase()}`,
        `        ON DELETE ${getForeignKeyonDelete(foreignKey).toUpperCase()}`,
    );
}

export function dropForeignKey (sql: TClientSql, table: TSchemaTable, foreignKey: TCheckForeignKey) {
    const constraint = sql.dialect === 'postgres' ? 'CONSTRAINT' : 'FOREIGN KEY';

    return renderSql(
        `ALTER TABLE ${sql.q(table.name)}`,
        `    DROP ${constraint} ${foreignKey.name}`
    );
}
