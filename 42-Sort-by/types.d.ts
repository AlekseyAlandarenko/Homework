declare module 'sort-by' {
    export declare function sortBy<T>(...args: Array<string | ((property: string, value: any) => any)>): (a: T, b: T) => number;
}