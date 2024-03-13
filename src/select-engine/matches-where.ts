import { TTable } from '../../project/private-types';
import { TWhereOptions } from '../../project/types';
import { isPojo } from '../util/helpers';

export default function matchesWhere (row: TTable<any>, where: TWhereOptions<any> = {}) {
    for (const key of Object.keys(where)) {
        if (key === 'or') {
            const wheres = where[key] as TWhereOptions<any>[];
            if (!wheres.some(subWhere => matchesWhere(row, subWhere))) return false;
        } else if (key === 'and') {
            const wheres = where[key] as TWhereOptions<any>[];
            if (!wheres.every(subWhere => matchesWhere(row, subWhere))) return false;
        } else if (isPojo(where[key])) {
            if (!matchesWhereOperator(row[key], key, where[key])) return false;
        } else {
            if (row[key] !== where[key]) return false;
        }
    }

    return true;
}

function matchesWhereOperator (value: any, operator: string, expected: any) {
    switch (operator) {
        case 'in': return Array.isArray(expected) && expected.includes(value);
        case 'notIn': return Array.isArray(expected) && !expected.includes(value);
        case 'lt': return value < expected;
        case 'lte': return value <= expected;
        case 'gt': return value > expected;
        case 'gte': return value >= expected;
        case 'ne': return value !== expected;
        case 'like': return matchesLike(value, expected);
        case 'notLike': return !matchesLike(value, expected);
        case 'isNull': return value === null;
        case 'isNotNull': return value !== null;
    }

    return true;
}

function matchesLike (value: string, likeStatement: string) {
    // convert the sql like statement to javascript regexp
    // compare the value with the regexp

    const regexp = likeStatement
        .replace(/%/g, '.*')
        .replace(/_/g, '.');
    const expected = new RegExp(`^${regexp}$`);

    return expected.test(value);
}
