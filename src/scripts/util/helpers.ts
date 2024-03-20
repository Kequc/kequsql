import { cancel, isCancel } from '@clack/prompts';
import path from 'path';
import { TKequsql } from '../../types';
import checkMysql from '../../dialects/mysql/check';
import checkPostgres from '../../dialects/postgres/check';
import { TDifferences } from '../types';

type NotSymbol<T> = T extends symbol ? never : T;

export function assertValue<T> (value: T): asserts value is NotSymbol<T> {
    if (isCancel(value)) {
        cancel('Operation canceled.');
        process.exit(0);
    }
}

export function getAbsolute (location: string) {
    return path.join(process.cwd(), location);
}

export function getCheckTables (db: TKequsql) {
    switch (db.sql.dialect) {
        case 'mysql': return checkMysql(db);
        case 'postgres': return checkPostgres(db);
    }

    throw new Error(`Dialect "${db.sql.dialect}" is not supported.`);
}

export function getDifferencesCount (differences: TDifferences) {
    return Object.values(differences).reduce((acc, diff) => acc + Object.values(diff).reduce((acc, diff) => acc + diff.length, 0), 0);
}

export function green (value: string): string {
    return `\u001b[32m${value}\u001b[39m`;
}

export function red (value: string): string {
    return `\u001b[31m${value}\u001b[39m`;
}
