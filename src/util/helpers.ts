import pluralizeLib from 'pluralize';
import { TRow } from '../types';

export function arraysMatch (a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    if (!a.every((col, i) => col === b[i])) return false;
    return true;
}

// mix up to five arrays together
export function zipper<A, B, R> (arrays: [A[], B[]], cb: (a: A, b: B) => R): R[];
export function zipper<A, B, C, R> (arrays: [A[], B[], C[]], cb: (a: A, b: B, c: C) => R): R[];
export function zipper<A, B, C, D, R> (arrays: [A[], B[], C[], D[]], cb: (a: A, b: B, c: C, d: D) => R): R[];
export function zipper<A, B, C, D, E, R> (arrays: [A[], B[], C[], D[], E[]], cb: (a: A, b: B, c: C, d: D, e: E) => R): R[];
export function zipper<R> (arrays: any[][], cb: (...args: any[]) => R): R[] {
    const max = Math.max(...arrays.map(arr => arr.length));
    const result: R[] = [];

    for (let i = 0; i < max; i++) {
        const args = arrays.map(arr => arr[i]);
        result.push(cb(...args));
    }

    return result;
}

export function isPojo<T = any> (obj: unknown): obj is Record<string, T> {
    if (obj === null || typeof obj !== "object") return false;
    return Object.getPrototypeOf(obj) === Object.prototype;
}

export function renderSql (...parts: (string | undefined)[]) {
    return parts.filter(Boolean).join('\n') + ';';
}

export function wat (title: string, data: unknown) {
    console.dir({ title, data }, { depth: null });
}

export function deepFreeze (o: any) {
    Object.freeze(o);
    Object.getOwnPropertyNames(o).forEach(function (prop) {
        if (o.hasOwnProperty(prop)
            && o[prop] !== null
            && (typeof o[prop] === "object" || typeof o[prop] === "function")
            && !Object.isFrozen(o[prop])) {
                deepFreeze(o[prop]);
            }
    });
    return o;
}

export function getDisplayTable (table: string, singular = true) {
    const name = table.charAt(0).toLowerCase() + table.slice(1);
    return singular ? name : pluralizeLib.plural(name);
}

export function drill (data: TRow, breadcrumb: string[], value: unknown): void {
    if (breadcrumb.length === 0) throw new Error('Cannot drill with empty breadcrumb');

    let current = data;

    for (let i = 0; i < breadcrumb.length - 1; i++) {
        const key = breadcrumb[i];
        if (current[key] === undefined) current[key] = {};
        current = current[key] as TRow;
    }

    current[breadcrumb[breadcrumb.length - 1]] = value;
}

export function dig (data: TRow, breadcrumb: string[]): TRow | undefined {
    let current = data;

    for (const key of breadcrumb) {
        current = current?.[key as keyof typeof current] as TRow;
    }

    return current;
}

export function pluralize (count: number, singular: string, plural: string, showCount = true) {
    const text = count === 1 ? singular : plural;
    return showCount ? `${count} ${text}` : text;
}
