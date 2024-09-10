interface IObj1 {
    A: any;
    B: any;
    C: any;
}

const obj1: IObj1 = {
    A: 1,
    B: 2,
    C: 3,
}

interface IObj2 {
    A: any;
    C: any;
}

const obj2: IObj2 = {
    A: 1,
    C: 3,
}

function difference<T1 extends object, T2 extends object>(obj1: T1, obj2: T2): Partial<T1> {
    let newObj: Partial<T1> = {};
    Object.keys(obj1).forEach((key: string) => {
        if (!Object.keys(obj2).includes(key)) {
            newObj[key as keyof T1] = obj1[key as keyof T1];
        }
    });
    return newObj;
}

console.log(difference(obj1, obj2));