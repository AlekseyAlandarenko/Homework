interface IObj {
    A: any;
    B: any;
    C: any;
}

const obj: IObj = {
    A: 1,
    B: 2,
    C: 3,
}

function pickObjectKeys<T extends object, K extends keyof T>(obj: T, keys: K[]): Partial<T> {
    let newObj: Partial<T> = {};
    keys.forEach((key: K) => {
        if (key in obj) {
            newObj[key] = obj[key];
        }
    });
    return newObj;
}

console.log(pickObjectKeys(obj, ['A', 'C']));