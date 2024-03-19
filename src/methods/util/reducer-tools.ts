import { isPojo } from '@/util/helpers';
import { TWhereModifierIn } from '@/types';

export function buildReducer<T> (
    comparator: (a: T, b: T) => boolean,
    combiner: (a: T[]) => T[]
) {
    return function (wheres: T[]): T[] {
        const checking = new Set(wheres);
        const result: T[] = [];
        // wat('start reducer', wheres);

        while (checking.size > 0) {
            const [where] = checking.values();
            const combine: T[] = [where];
            checking.delete(where);
            // wat('middle reducer', [...checking]);

            for (const other of checking) {
                if (comparator(where, other)) continue;
                combine.push(other);
                checking.delete(other);
            }

            result.push(...combiner(combine));
        }
        // wat('reducer', result);

        return result;
    }
}

export function buildCombiner<T> (
    getMergeKey: (a: T, b: Set<T>) => [T[], string],
    combiner: (a: T, b: T[], mergeKey: string) => T
) {
    return function (wheres: T[]): T[] {
        const checking = new Set(wheres);
        const result: T[] = [];
        // wat('start combiner', wheres);

        while (checking.size > 0) {
            const [wheres] = checking.values();
            checking.delete(wheres);
            const duplicates = [...checking].filter(other => deepEqual(wheres, other));
            for (const duplicate of duplicates) { checking.delete(duplicate); }

            const [others, mergeKey] = getMergeKey(wheres, checking);
            for (const other of others) { checking.delete(other); }
            // wat('middle combiner', others);

            if (others.length > 0) {
                result.push(combiner(wheres, others, mergeKey));
            } else {
                result.push(wheres);
            }
        }

        return result;
    }
}

export function buildBestMergeKey<T> (getKey : (a: T, b: T) => string | undefined) {
    return function (wheres: T, checking: Set<T>): [T[], string] {
        const map: Record<string, T[]> = {};

        for (const others of checking) {
            const key = getKey(wheres, others);
            if (key === undefined) continue;
            map[key] = map[key] || [];
            map[key].push(others);
        }

        return Object.entries(map).reduce<[T[], string]>((acc, [key, others]) => {
            if (others.length > acc[0].length) return [others, key];
            return acc;
        }, [[], '']);
    };
}

export function combineValues (value: unknown, others: unknown[]): (TWhereModifierIn<unknown> | unknown)[] {
    const results: TWhereModifierIn<unknown>[] = [getIn(value)];

    for (const other of others) {
        const otherIn = getIn(other);
        let isResolved = false;

        for (const result of results) {
            if (!hasSameKeys(result, otherIn)) continue;
            if (result.ne !== otherIn.ne) continue;
            if (result.like !== otherIn.like) continue;
            if (result.notLike !== otherIn.notLike) continue;
            if (result.isNull !== otherIn.isNull) continue;
            if (result.isNotNull !== otherIn.isNotNull) continue;
            if (result.lt !== otherIn.lt) continue;
            if (result.lte !== otherIn.lte) continue;
            if (result.gt !== otherIn.gt) continue;
            if (result.gte !== otherIn.gte) continue;

            const notInLength = result.notIn?.length ?? 0;
            if (unique(result.notIn, otherIn.notIn).length !== notInLength) continue;

            if (result.in || otherIn.in) result.in = unique(result.in, otherIn.in);
            isResolved = true;
            break;
        }

        if (!isResolved) results.push(otherIn);
    }

    return results.map(getOut);
}

export function unique (a?: unknown[], b?: unknown[]) {
    return [...new Set([...(a ?? []), ...(b ?? [])])];
}

export function getIn (value: unknown) {
    return isPojo(value) ? { ...value } : { in: [value] } as TWhereModifierIn<unknown>;
}

export function getOut (value: TWhereModifierIn<unknown>) {
    if (Object.keys(value).length === 1 && value.in !== undefined && value.in.length === 1) return value.in![0];
    return value;
}

export function hasSameKeys (a: object, b: object): boolean {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);

    if (aKeys.length !== bKeys.length) return false;
    if (aKeys.some(key => !bKeys.includes(key))) return false;

    return true;
}

export function deepEqual (a: unknown, b: unknown): boolean {
    if (a === b) return true;

    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        return a.every((value, i) => deepEqual(value, b[i]));
    }

    if (isPojo(a) && isPojo(b)) {
        const aKeys = Object.keys(a);
        const bKeys = Object.keys(b);

        if (aKeys.length !== bKeys.length) return false;
        if (aKeys.some(key => !bKeys.includes(key))) return false;

        return aKeys.every(key => deepEqual(a[key], b[key]));
    }

    return false;
}
