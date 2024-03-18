import { zipper } from '@/helpers';
import { TSchemeSql, TStrategy } from '@/types';

export default function renderFrom (
    sql: TSchemeSql,
    strategy: TStrategy[],
    skipFirst = false,
): string[] {
    const result: string[] = [];

    for (let index = 0; index < strategy.length; index++) {
        if (index === 0 && skipFirst) continue;
        const { table, parentTable } = strategy[index];
        const command = result.length < 1 ? 'FROM' : 'LEFT JOIN';
        result.push(`${command} ${sql.q(table.name)} t${index}`);
        if (parentTable === undefined) continue;
        result.push(renderOn(sql, strategy, index));
    }

    return result;
}

function renderOn (
    sql: TSchemeSql,
    strategy: TStrategy[],
    index: number,
): string {
    const { table, parentTable } = strategy[index];
    const relation = table.relations.find(({ table }) => table === parentTable);
    const parentIndex = strategy.findIndex(({ table }) => table === parentTable);

    const result = zipper(
        [relation.columns, relation.ids],
        (column, id) => `t${parentIndex}.${sql.q(id)} = t${index}.${sql.q(column)}`,
    );

    return 'ON ' + result.join(' AND ');
}
