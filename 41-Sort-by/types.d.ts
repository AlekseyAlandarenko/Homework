declare module 'sort-by' {
    type SortKey<T> = keyof T | (<K extends keyof T>(property: K, value: T[K]) => unknown);

    export function sortBy<T>(...args: SortKey<T>[]): (a: T, b: T) => number;
}