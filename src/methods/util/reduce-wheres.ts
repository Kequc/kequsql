import { isPojo, zipper } from '@/util/helpers';
import { TWhereOptions } from '@/types';
import { buildBestMergeKey, buildCombiner, buildReducer, combineValues, deepEqual, hasSameKeys } from './reducer-tools';

export default function reduceWheres (wheres: TWhereOptions<any>[]): TWhereOptions<any> | undefined {
    if (wheres.length === 0) return undefined;
    if (wheres.some(whereIsEmpty)) return undefined;
    if (wheres.length === 1) return wheres[0];

    const combined = reduceWheresOr(wheres);
    if (combined.length <= 1) return combined[0];
    return { or: combined };
}

function whereIsEmpty (where: TWhereOptions<any> | undefined) {
    return isPojo(where) ? Object.keys(where!).length < 1 : true;
}

const bestMergeKeyOr = buildBestMergeKey<TWhereOptions<any>>((a, b) => {
    const mergeKeys = Object.keys(a).filter(key => !deepEqual(a[key], b[key]));
    if (mergeKeys.length > 1) return; // too many matches
    return mergeKeys[0];
});

const bestMergeKeyAnd = buildBestMergeKey<TWhereOptions<any>[]>((a, b) => {
    const matches = zipper([a, b], deepEqual);
    const count = matches.filter(isMatch => !isMatch).length;
    if (count > 1) return; // too many matches
    return String(matches.indexOf(false));
});

const combineWheresOr = buildCombiner<TWhereOptions<any>>(bestMergeKeyOr, (a, bb, mergeKey) => {
    const wheres = combineWheres(a, bb, mergeKey);
    if (wheres.length <= 1) return wheres[0];
    return { or: wheres };
});

const combineWheresAnd = buildCombiner<TWhereOptions<any>[]>(bestMergeKeyAnd, (a, bb, mergeKey) => {
    const mergeIndex = Number(mergeKey);
    const wheres = combineWheresOr([a[mergeIndex], ...bb.map(b => b[mergeIndex])]);
    const combined = wheres.length <= 1 ? wheres[0] : { or: wheres };
    const result = [...a];
    result[mergeIndex] = combined;
    return result;
});

const reduceWheresOr = buildReducer<TWhereOptions<any>>((a, b) => {
    return !hasSameKeys(a, b);
}, combineWheresOr);

const reduceWheresAnd = buildReducer<TWhereOptions<any>[]>((a, b) => {
    if (a.length !== b.length) return true;
    return !zipper([a, b], hasSameKeys).every(Boolean);
}, combineWheresAnd);

function combineWheres (where: TWhereOptions<any>, others: TWhereOptions<any>[], mergeKey: string): TWhereOptions<any> {
    const valuesArray = others.map(other => other[mergeKey]);

    if (mergeKey === 'or') {
        const aArray = where[mergeKey] as TWhereOptions<any>[];
        const bArray = valuesArray as TWhereOptions<any>[][];
        return reduceWheresOr([...aArray, ...bArray.flat()]);
    }

    if (mergeKey === 'and') {
        const aArray = where[mergeKey] as TWhereOptions<any>[];
        const bArray = valuesArray as TWhereOptions<any>[][];
        return reduceWheresAnd([aArray, ...bArray]).map(value => ({ and: value }));
    }

    return combineValues(where[mergeKey], valuesArray).map(value => ({
        ...where,
        [mergeKey]: value
    }));
}
