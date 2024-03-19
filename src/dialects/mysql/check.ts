import { renderSql, zipper } from '../../util/helpers';
import { TInternal } from '../../types';
import { TCheckColumn, TCheckForeignKey, TCheckIndex, TCheckTable } from '../check-types';
import { TSchemaIndexType } from '../../schema/schema-types';

export default async function getTables (db: TInternal): Promise<TCheckTable[]> {
    const query = renderSql(
        'SELECT TABLE_NAME',
        'FROM INFORMATION_SCHEMA.TABLES',
        'WHERE TABLE_SCHEMA = DATABASE()',
    );
    const raw = await db.query<any[]>(query, [], true);
    const tables = raw.map(tableParse);
    const columns2 = await Promise.all(tables.map(table => getColumns(db, table.name)));
    const indexes2 = await Promise.all(tables.map(table => getIndexes(db, table.name)));
    const foreignKeys2 = await Promise.all(tables.map(table => getForeignKeys(db, table.name)));

    return zipper([tables, columns2, indexes2, foreignKeys2], (table, columns, indexes, foreignKeys) => ({
        ...table,
        columns,
        indexes,
        foreignKeys
    }) as TCheckTable);
}

function tableParse (raw: any) {
    return {
        name: raw.TABLE_NAME,
    };
}

async function getColumns (db: TInternal, table: string): Promise<TCheckColumn[]> {
    const query = renderSql(
        'SELECT COLUMN_NAME, ORDINAL_POSITION, COLUMN_DEFAULT, IS_NULLABLE, COLUMN_TYPE, EXTRA',
        'FROM INFORMATION_SCHEMA.COLUMNS',
        'WHERE TABLE_SCHEMA = DATABASE()',
        'AND TABLE_NAME = ?',
    );
    const raw = await db.query<any[]>(query, [table], true);

    return raw.sort(columnSort).map(columnParse);
}

function columnSort (a: any, b: any): number {
    return a.ORDINAL_POSITION - b.ORDINAL_POSITION;
}

function columnParse (raw: any): TCheckColumn {
    return {
        name: raw.COLUMN_NAME,
        nullable: raw.IS_NULLABLE === 'YES',
        type: raw.COLUMN_TYPE.toUpperCase(),
        default: raw.COLUMN_DEFAULT,
        extra: raw.EXTRA.toUpperCase(),
    };
}

async function getIndexes (db: TInternal, table: string): Promise<TCheckIndex[]> {
    const query = renderSql(
        'SHOW INDEX FROM ${table}',
    );
    const raw = await db.query<any[]>(query, undefined, true);
    const collapsed: Record<string, TCheckIndex[]> = {};

    for (const item of raw) {
        collapsed[item.Key_name] = collapsed[item.Key_name] || [];
        collapsed[item.Key_name].push(item);
    }

    return Object.values(collapsed).map(collapsedIndexParse).sort(indexNameSort);
}

function indexNameSort (a: { columns: string[] }, b: { columns: string[] }): number {
    return a.columns.join('_').localeCompare(b.columns.join('_'));
}

function collapsedIndexParse (raw: any[]): TCheckIndex {
    const items = raw.sort((a, b) => a.Seq_in_index - b.Seq_in_index);

    return {
        name: raw[0].Key_name,
        type: getIndexType(raw[0]),
        columns: items.map(item => item.Column_name),
    };
}

function getIndexType (raw: any): TSchemaIndexType {
    if (raw.Key_name === 'PRIMARY') return 'primary';
    if (raw.Non_unique === 0) return 'unique';
    if (raw.Index_type === 'FULLTEXT') return 'fulltext';
    return 'index';
}

async function getForeignKeys (db: TInternal, table: string): Promise<TCheckForeignKey[]> {
    const query = renderSql(
        'SELECT DISTINCT KCU.CONSTRAINT_NAME, KCU.REFERENCED_TABLE_NAME, KCU.COLUMN_NAME, KCU.ORDINAL_POSITION, KCU.REFERENCED_COLUMN_NAME, RC.UPDATE_RULE, RC.DELETE_RULE',
        'FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS KCU',
        'JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS AS RC',
        'ON KCU.CONSTRAINT_NAME = RC.CONSTRAINT_NAME',
        'WHERE KCU.CONSTRAINT_SCHEMA = DATABASE()',
        'AND KCU.TABLE_NAME = ?',
        'AND KCU.REFERENCED_TABLE_NAME IS NOT NULL',
    );
    const raw = await db.query<any[]>(query, [table], true);
    const collapsed: Record<string, TCheckForeignKey[]> = {};

    for (const item of raw) {
        collapsed[item.CONSTRAINT_NAME] = collapsed[item.CONSTRAINT_NAME] || [];
        collapsed[item.CONSTRAINT_NAME].push(item);
    }

    return Object.values(collapsed).map(collapsedForeignKeyParse).sort(nameSort);
}

function collapsedForeignKeyParse (raw: any[]): TCheckForeignKey {
    const items = raw.sort((a, b) => a.ORDINAL_POSITION - b.ORDINAL_POSITION);

    return {
        name: raw[0].CONSTRAINT_NAME,
        table: raw[0].REFERENCED_TABLE_NAME,
        ids: items.map(item => item.REFERENCED_COLUMN_NAME),
        columns: items.map(item => item.COLUMN_NAME),
        onDelete: raw[0].DELETE_RULE,
        onUpdate: raw[0].UPDATE_RULE,
    };
}

function nameSort (a: any, b: any): number {
    return a.name.localeCompare(b.name);
}
