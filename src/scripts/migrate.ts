import { cancel, confirm, intro, isCancel, outro, spinner, text } from '@clack/prompts';
import fse from 'fs-extra';
import path from 'path';
import { TKequsql } from '../types';
import checkMysql from '../dialects/mysql/check';
import checkPostgres from '../dialects/postgres/check';

async function main () {
    intro(`kequsl-migrate`);

    const location = await text({
        message: `Provide a database instance:`,
        initialValue: './database/db.ts',
        validate (value) {
            if (!value) return 'Path is required';
            if (!fse.existsSync(getAbsolute(value))) return 'Path does not exist';
        },
    });

    if (isCancel(location)) {
        cancel('Operation cancelled.');
        process.exit(0);
    }

    const s = spinner();
    s.start('Checking...');

    const db: TKequsql = (await import(getAbsolute(location))).default;
    const checkTables = await getCheckTables(db);

    s.stop('Done!\n\nNow what?\n');

    const isReady = await confirm({
        message: `Do you want to persist changes to the database?`,
        initialValue: false,
    });

    if (isCancel(isReady)) {
        cancel('Operation cancelled.');
        process.exit(0);
    }

    outro(`You're all set!`);
    process.exit(0);
}
main();

function getAbsolute (location: string) {
    return path.join(process.cwd(), location);
}

function getCheckTables (db: TKequsql) {
    switch (db.sql.dialect) {
        case 'postgres': return checkPostgres(db);
        case 'mysql': return checkMysql(db);
    }

    throw new Error(`Dialect "${db.sql.dialect}" is not supported.`);
}
