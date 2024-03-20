import { renderSql, zipper } from '../../util/helpers';
import { TInternal } from '../../types';
import { TCheckColumn, TCheckForeignKey, TCheckIndex, TCheckTable } from '../types';
import { TSchemaForeignKeyAction, TSchemaIndexType } from '../../schema/types';

export default async function getTables (db: TInternal): Promise<TCheckTable[]> {
    const query = renderSql(
        'SELECT tablename AS table_name',
        'FROM pg_catalog.pg_tables',
        'WHERE schemaname = current_database()',
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
        name: raw.table_name
    };
}

async function getColumns (db: TInternal, table: string): Promise<TCheckColumn[]> {
    const query = renderSql(
        'SELECT column_name, ordinal_position, column_default, is_nullable, data_type',
        'FROM information_schema.columns',
        'WHERE table_schema = current_database()',
        'AND table_name = ?',
    );
    const raw = await db.query<any[]>(query, [table], true);

    return raw.sort(columnSort).map(columnParse);
}

function columnSort (a: any, b: any): number {
    return a.ordinal_position - b.ordinal_position;
}

function columnParse (raw: any): TCheckColumn {
    return {
        name: raw.column_name,
        type: raw.data_type.toUpperCase(),
        default: raw.column_default,
        nullable: raw.is_nullable === 'YES',
        extra: '',
    };
}

async function getIndexes (db: TInternal, table: string): Promise<TCheckIndex[]> {
    const query = renderSql(
        'SELECT indexname, indexdef',
        'FROM pg_indexes',
        'WHERE schemaname = current_database()',
        'AND tablename = ?',
    );
    const raw = await db.query<any[]>(query, [table], true);

    return raw.map(indexParse).sort(indexNameSort);
}

function indexNameSort (a: { columns: string[] }, b: { columns: string[] }): number {
    return a.columns.join('_').localeCompare(b.columns.join('_'));
}

function indexParse (raw: any): TCheckIndex {
    const name = raw.indexname;
    const columns = raw.indexdef.match(/\(([^)]+)\)/)[1].split(', ').map((column: string) => column.trim());
    const type = getIndexType(raw.indexdef);

    return {
        name,
        columns,
        type,
    };
}

function getIndexType (indexDef: string): TSchemaIndexType {
    if (indexDef.includes('UNIQUE')) return 'unique';
    if (indexDef.includes('PRIMARY KEY')) return 'primary';
    return 'index';
}

async function getForeignKeys (db: TInternal, table: string): Promise<TCheckForeignKey[]> {
    const query = renderSql(
        'SELECT DISTINCT conname AS CONSTRAINT_NAME, confrelid::regclass AS REFERENCED_TABLE_NAME, a.attname AS COLUMN_NAME, confupdtype AS UPDATE_RULE, confdeltype AS DELETE_RULE, unnest(conkey) AS ORDINAL_POSITION, af.attname AS REFERENCED_COLUMN_NAME',
        'FROM pg_constraint',
        'JOIN pg_attribute a ON a.attnum = unnest(conkey)',
        'JOIN pg_attribute af ON af.attnum = unnest(confkey)',
        'JOIN pg_class ON pg_class.oid = pg_constraint.conrelid',
        'JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace',
        'WHERE pg_namespace.nspname = current_database()',
        'AND pg_class.relname = ?',
        'AND pg_constraint.contype = "f"',
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
    const name = raw[0].CONSTRAINT_NAME;
    const items = raw.sort((a, b) => a.ORDINAL_POSITION - b.ORDINAL_POSITION);

    return {
        name,
        table: items[0].REFERENCED_TABLE_NAME,
        ids: items.map(item => item.REFERENCED_COLUMN_NAME),
        columns: items.map(item => item.COLUMN_NAME),
        onDelete: getForeignKeyRule(items[0].DELETE_RULE),
        onUpdate: getForeignKeyRule(items[0].UPDATE_RULE)
    };
}

function getForeignKeyRule (rule: string): TSchemaForeignKeyAction {
    switch (rule) {
        case 'r': return 'restrict';
        case 'c': return 'cascade';
        case 'n': return 'set null';
        default: return 'no action';
    }
}

function nameSort (a: { name: string }, b: { name: string }): number {
    return a.name.localeCompare(b.name);
}
