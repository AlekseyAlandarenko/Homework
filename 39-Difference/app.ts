function difference<T1 extends object, T2 extends object>(obj1: T1, obj2: T2): Partial<T1> {
    let newObj: Partial<T1> = {};
    (Object.keys(obj1) as Array<keyof T1>).forEach((key) => {
        if (!(key in obj2)) {
            newObj[key] = obj1[key];
        }
    });
    return newObj;
}