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

function pickObjectKeys<T extends object, K extends keyof T>(obj: T, arr: K[]): { [k: string]: T[K] } {
    let newObj: [string, T[K]][] = [];
    arr.forEach((key: K) => {
        Object.entries(obj).forEach(entry => {
            if (entry[0] === String(key)) newObj.push(entry);
        });
    });
    return Object.fromEntries(newObj);
}

console.log(pickObjectKeys(obj, ['A', 'C']));