function pickObjectKeys<T extends object, K extends keyof T>(obj: T, keys: K[]): Partial<T> {
    let newObj: Partial<T> = {};
    keys.forEach((key: K) => {
        if (key in obj) {
            newObj[key] = obj[key];
        }
    });
    return newObj;
}