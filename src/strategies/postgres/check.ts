import { TInternal, TSchemaColumn, TSchemaForeignKey, TSchemaForeignKeyType, TSchemaIndex, TSchemaIndexType, TSchemaTable, TSchemaTableOptions } from '../../types';
import { getDisplayTable, zipper } from '../../helpers';

export default async function getTables (db: TInternal): Promise<TSchemaTable[]> {
    const query = `
        SELECT tablename AS table_name
        FROM pg_catalog.pg_tables
        WHERE schemaname = ?`;
    const raw = await db.query<any[]>(query, [db.info.database], true);
    const tables = raw.map(tableParse);
    const columns2 = await Promise.all(tables.map(table => getColumns(db, table.name)));
    const indexes2 = await Promise.all(tables.map(table => getIndexes(db, table.name)));
    const foreignKeys2 = await Promise.all(tables.map(table => getForeignKeys(db, table.name)));

    return zipper([tables, columns2, indexes2, foreignKeys2], (table, columns, indexes, foreignKeys) => ({
        ...table,
        columns,
        indexes,
        foreignKeys
    }) as TSchemaTable);
}

function tableParse (raw: any): TSchemaTableOptions {
    return {
        name: raw.table_name
    };
}

async function getColumns (db: TInternal, table: string): Promise<TSchemaColumn[]> {
    const query = `
        SELECT column_name, ordinal_position, column_default, is_nullable, data_type, column_comment
        FROM information_schema.columns
        WHERE table_schema = ?
        AND table_name = ?`;
        const raw = await db.query<any[]>(query, [db.info.database, table], true);

    return raw.sort(columnSort).map(columnParse);
}

function columnSort (a: any, b: any): number {
    return a.ordinal_position - b.ordinal_position;
}

function columnParse (raw: any): TSchemaColumn {
    return {
        name: raw.column_name,
        type: { mysql: '', postgres: raw.data_type },
        default: raw.column_default,
        nullable: raw.is_nullable === 'YES',
        unsigned: false, // postgres does not support unsigned integers
        increment: raw.column_default && raw.column_default.includes('nextval')
    };
}

async function getIndexes (db: TInternal, table: string): Promise<TSchemaIndex[]> {
    const query = `
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = ?
        AND tablename = ?`;
    const raw = await db.query<any[]>(query, [db.info.database, table], true);

    return raw.map(indexParse).sort(indexNameSort);
}

function indexNameSort (a: { columns: string[] }, b: { columns: string[] }): number {
    return a.columns.join('_').localeCompare(b.columns.join('_'));
}

function indexParse (raw: any): TSchemaIndex {
    const name = raw.indexname;
    const columns = raw.indexdef.match(/\(([^)]+)\)/)[1].split(', ').map((column: string) => column.trim());
    const type = getIndexType(raw.indexdef);

    return { name, columns, type };
}

function getIndexType (indexDef: string): TSchemaIndexType {
    if (indexDef.includes('UNIQUE')) return 'UNIQUE';
    if (indexDef.includes('PRIMARY KEY')) return 'PRIMARY KEY';
    return 'INDEX';
}

async function getForeignKeys (db: TInternal, table: string): Promise<TSchemaForeignKey[]> {
    const query = `
        SELECT DISTINCT conname AS CONSTRAINT_NAME, confrelid::regclass AS REFERENCED_TABLE_NAME, a.attname AS COLUMN_NAME, confupdtype AS UPDATE_RULE, confdeltype AS DELETE_RULE, unnest(conkey) AS ORDINAL_POSITION, af.attname AS REFERENCED_COLUMN_NAME
        FROM pg_constraint
        JOIN pg_attribute a ON a.attnum = unnest(conkey)
        JOIN pg_attribute af ON af.attnum = unnest(confkey)
        JOIN pg_class ON pg_class.oid = pg_constraint.conrelid
        JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
        WHERE pg_namespace.nspname = ?
        AND pg_class.relname = ?
        AND pg_constraint.contype = 'f'`;
    const raw = await db.query<any[]>(query, [db.info.database, table], true);

    const collapsed: Record<string, TSchemaForeignKey[]> = {};

    for (const item of raw) {
        collapsed[item.CONSTRAINT_NAME] = collapsed[item.CONSTRAINT_NAME] || [];
        collapsed[item.CONSTRAINT_NAME].push(item);
    }

    return Object.values(collapsed).map(collapsedForeignKeyParse).sort(nameSort);
}

function collapsedForeignKeyParse (raw: any[]): TSchemaForeignKey {
    const name = raw[0].CONSTRAINT_NAME;
    const items = raw.sort((a, b) => a.ORDINAL_POSITION - b.ORDINAL_POSITION);

    return {
        name,
        columns: items.map(item => item.COLUMN_NAME),
        ids: items.map(item => item.REFERENCED_COLUMN_NAME),
        table: items[0].REFERENCED_TABLE_NAME,
        displayTable: getDisplayTable(items[0].REFERENCED_TABLE_NAME),
        onDelete: getForeignKeyRule(items[0].DELETE_RULE),
        onUpdate: getForeignKeyRule(items[0].UPDATE_RULE)
    };
}

function getForeignKeyRule (rule: string): TSchemaForeignKeyType {
    switch (rule) {
        case 'r': return 'RESTRICT';
        case 'c': return 'CASCADE';
        case 'n': return 'SET NULL';
        case 'd': return 'SET DEFAULT';
        default: return 'NO ACTION';
    }
}

function nameSort (a: { name: string }, b: { name: string }): number {
    return a.name.localeCompare(b.name);
}
