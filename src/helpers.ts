import pluralize from 'pluralize';

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
    if (obj === null || typeof obj !== "object") {
        return false;
    }

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
    return singular ? name : pluralize.plural(name);
}
