import { TSchemaTable, TSchemaColumn, TRelation } from '../../schema/schema-types';
import { TOrderOptions, TRaw, TSchemeSql } from '../../types';

export function renderOrderBy (sql: TSchemeSql, order: TOrderOptions<any> = {}) {
    const result: string[] = [];

    for (const [name, value] of Object.entries(order)) {
        result.push(`${sql.q(name)} ${value}`);
    }

    return result.length === 0 ? '' : `ORDER BY ${result.join(', ')}`;
}

export function renderLimit ({ limit, offset }: { limit?: number, offset?: number }) {
    if (limit === undefined) return '';
    if (offset !== undefined) return `LIMIT ${limit} OFFSET ${offset}`;
    return `LIMIT ${limit}`;
}

export interface TFindStrategy {
    table: TSchemaTable;
    breadcrumb: string[];
    columns: TSchemaColumn[];
    relations: TRelation[];
}

export function renderSelect (
    sql: TSchemeSql,
    strategy: TFindStrategy[],
): string {
    return strategy.map(({ columns }, i) => renderSelectColumns(sql, columns, i)).flat().join(', ');
}

function renderSelectColumns (
    sql: TSchemeSql,
    columns: TSchemaColumn[],
    tableIndex: number,
): string[] {
    let i = 0;
    return columns.map(({ name }) => `t${tableIndex}.${sql.q(name)} t${tableIndex}_${i++}`);
}

export function renderFrom (
    sql: TSchemeSql,
    strategy: TFindStrategy[],
    relations: TRelation[],
): string[] {
    const result: string[] = [];

    for (const [index, { table }] of strategy.entries()) {
        if (index === 0) {
            result.push(`FROM ${sql.q(table.name)} t0`);
            continue;
        }

        result.push(`JOIN ${sql.q(table.name)} t${index}`);
        result.push(renderOn(sql, strategy, relations, index));
    }

    return result;
}

function renderOn (
    sql: TSchemeSql,
    strategy: TFindStrategy[],
    relations: TRelation[],
    index: number,
): string {
    const result: string[] = [];
    const { table } = strategy[index];
    const relation = relations.find(relation => relation.table === table);
    const parentIndex = strategy.findIndex(({ table }) => table === relation.table);

    for (let i = 0; i < relation.columns.length; i++) {
        result.push(`t${index}.${sql.q(relation.columns[i])} = t${parentIndex}.${sql.q(relation.ids[i])}`);
    }

    return 'ON ' + result.join(' AND ');
}

export function drill (result: TRaw, breadcrumb: string[], value: unknown): void {
    let current = result;

    for (let i = 0; i < breadcrumb.length - 1; i++) {
        const key = breadcrumb[i];
        if (current[key] === undefined) current[key] = {};
        current = current[key] as TRaw;
    }

    current[breadcrumb[breadcrumb.length - 1]] = value;
}

export function dig (row: TRaw, breadcrumb: string[]): TRaw {
    let current = row;

    for (let i = 0; i < breadcrumb.length; i++) {
        current = current[breadcrumb[i] as keyof typeof current] as TRaw;
    }

    return current;
}
