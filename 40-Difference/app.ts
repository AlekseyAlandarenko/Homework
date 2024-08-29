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

function difference<T1 extends object, T2 extends object>(obj1: T1, obj2: T2): Omit<T1, keyof T2> {
    let newObj: [string, any][] = [];
    Object.keys(obj1).forEach(key => {
        if (!Object.keys(obj2).includes(key)) {
            Object.entries(obj1).forEach(entry => {
                if (entry[0] === key) newObj.push(entry);
            });
        }
    });
    return Object.fromEntries(newObj) as Omit<T1, keyof T2>;
}

console.log(difference(obj1, obj2));