import { TWaiting } from '../../project/types';
import { isPojo } from '../util/helpers';

export default function splitIntoBatches (waiting: TWaiting[]) {
    // return different batches of requests based on the options
    // if the select options are different, they should be in different batches
    // if the limit or offset are set, they should be in separate individual batches

    const [checking, batches] = prepare(waiting);

    while (checking.size > 0) {
        const batch: TWaiting[] = [];
        const [request] = checking;
        checking.delete(request);
        batch.push(request);

        for (const other of checking) {
            if (request.query !== other.query) continue;
            if (!matchesSelectOptions(request.select, other.select)) continue;
            // if (!matchesWhereOptions(request.where, other.where)) continue;

            checking.delete(other);
            batch.push(other);
        }

        batches.push(batch);
    }

    return batches;
}

function prepare (waiting: TWaiting[]): [checking: Set<TWaiting>, batches: TWaiting[][]] {
    const checking: TWaiting[] = [];
    const batches: TWaiting[][] = [];

    for (const request of waiting) {
        if (request.limit !== undefined || request.offset !== undefined) {
            batches.push([request]);
        } else {
            checking.push(request);
        }
    }

    return [new Set(checking), batches];
}

function matchesSelectOptions (a: TWaiting['select'] = {}, b: TWaiting['select'] = {}) {
    // select options are considered the same if they have the same keys

    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);

    if (aKeys.length !== bKeys.length) return false;

    for (const key of aKeys) {
        if (!bKeys.includes(key)) return false;
    }

    return true;
}

function matchesWhereOptions (a: TWaiting['where'] = {}, b: TWaiting['where'] = {}, checkKeys = false) {
    // where options are considered the same unless a value is an
    // object and that object has different keys

    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    const keys = new Set([...aKeys, ...bKeys]);

    if (checkKeys) {
        if (aKeys.length !== bKeys.length) return false;

        for (const key of aKeys) {
            if (!bKeys.includes(key)) return false;
        }
    }

    for (const key of keys) {
        const aValue = isPojo(a[key]);
        const bValue = isPojo(b[key]);

        if (aValue && bValue) {
            if (!matchesWhereOptions(a[key], b[key], true)) return false;
        } else if (aValue !== bValue) {
            return false;
        }
    }
}
