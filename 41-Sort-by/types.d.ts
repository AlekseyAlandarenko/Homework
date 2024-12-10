declare module 'sort-by' {
    type SortKey<T> = keyof T | ((property: keyof T, value: T[keyof T]) => any);

    export function sortBy<T>(...args: SortKey<T>[]): (a: T, b: T) => number;
}