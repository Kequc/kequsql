import { pluralize } from '../../util/helpers';
import { getForeignKeyName, getForeignKeyonDelete, getForeignKeyonUpdate, getIndexName } from '../../schema/schema-parser';
import { TDifferences } from '../types';
import { green, red } from './helpers';

type TTableRow = [string, string, string];
const HEADERS: TTableRow = ['action', 'name', 'details'];

export default function renderDifferences (differences: TDifferences) {
    const rows: TTableRow[] = [];

    for (const { foreignKey } of differences.foreignKeys.delete) {
        rows.push(['drop fkey', foreignKey.name, getForeignKeyAction(foreignKey)]);
    }
    for (const { index } of differences.indexes.delete) {
        rows.push(['drop index', index.name, index.type]);
    }
    for (const { table, column } of differences.columns.delete) {
        rows.push(['drop column', getColumnName(table, column), '']);
    }
    for (const { table } of differences.tables.delete) {
        rows.push(['drop table', table.name, '+' + pluralize(table.columns.length, 'column', 'columns')]);
    }
    for (const { table } of differences.tables.create) {
        rows.push(['create table', table.name, '+' + pluralize(table.columns.length, 'column', 'columns')]);
    }
    for (const { table, column } of differences.columns.create) {
        rows.push(['create column', getColumnName(table, column), '']);
    }
    for (const { table, column } of differences.columns.update) {
        rows.push(['update column', getColumnName(table, column), '']);
    }
    for (const { table, index } of differences.indexes.create) {
        rows.push(['create index', getIndexName(table.name, index.column), index.type]);
    }
    for (const { table, foreignKey } of differences.foreignKeys.create) {
        rows.push(['create fkey', getForeignKeyName(table.name, foreignKey), getForeignKeyAction(foreignKey)]);
    }

    const columnLengths = rows.reduce((acc, row) => {
        for (let i = 0; i < row.length; i++) {
            acc[i] = Math.max(acc[i], row[i].length, HEADERS[i].length);
        }
        return acc;
    }, [0, 0, 0]);

    function renderCell (cell: string, i: number): string {
        const value = cell.padEnd(columnLengths[i]);
        return i === 0 ? colorize(value) : value;
    }

    return [
        HEADERS.map((header, i) => header.padEnd(columnLengths[i])).join('  '),
        columnLengths.map(count => '-'.repeat(count)).join('  '),
        ...rows.map(row => {
            return row.map(renderCell).join('  ');
        }),
    ].join('\n');
}

function getColumnName (table: any, column: any): string {
    return table.name + '.' + column.name;
}

function getForeignKeyAction (fk: any): string {
    return getForeignKeyonUpdate(fk) + ', ' + getForeignKeyonDelete(fk);
}

const COLORS = {
    'drop': red,
    'create': green,
    'update': green,
};

function colorize (value: string): string {
    return Object.entries(COLORS).reduce((acc, [key, color]) => acc.replace(key, color(key)), value);
}
