import { confirm, intro, outro, spinner, text } from '@clack/prompts';
import fse from 'fs-extra';
import { TKequsql } from '../types';
import { pluralize } from '../util/helpers';
import findDifferences from './util/find-differences';
import renderDifferences from './util/render-differences';
import { assertValue, getAbsolute, getCheckTables, getDifferencesCount } from './util/helpers';
import performMigration from './util/perform-migration';
import { TDifferences } from './scripts-types';

async function main () {
    intro('Migrate');

    const location = await text({
        message: 'Provide a database instance:',
        initialValue: './database/db.ts',
        validate (value) {
            if (!value) return 'Path is required';
            if (!fse.existsSync(getAbsolute(value))) return 'Path does not exist';
        },
    });

    assertValue(location);

    const s = spinner();
    s.start('Checking...');

    const db: TKequsql = (await import(getAbsolute(location))).default;
    const checkTables = await getCheckTables(db);
    const differences = findDifferences(db.schema.tables, checkTables);
    const differencesCount = getDifferencesCount(differences);

    if (differencesCount === 0) {
        s.stop('No changes to make.');
    } else {
        s.stop(renderChanges(differencesCount, differences));

        const persist = await confirm({
            message: `Persist ${pluralize(differencesCount, 'change', 'changes', false)} to the database?`,
            initialValue: false,
        });

        assertValue(persist);

        if (persist) {
            s.start('Migrating...');
            await performMigration(db, differences);
            s.stop(`${pluralize(differencesCount, 'change', 'changes')} persisted.`);
        }
    }

    outro('You\'re all set!');
    process.exit(0);
}

main();

function renderChanges (differencesCount: number, differences: TDifferences) {
    const message = pluralize(differencesCount, 'change', 'changes');
    const table = renderDifferences(differences);
    return `${message}:\n\n${table}\n`;
}
