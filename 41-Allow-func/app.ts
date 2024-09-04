class User {
    @allowFunc(a => a > 0)
    age!: number;
}

function allowFunc(fn: (a: number) => boolean) {
    return (
        target: Object,
        propertyKey: string | symbol
    ): void => {
        let value: number | undefined;
        const setter = function (newValue: number): void {
            if (!fn(newValue)) {
                console.log(`Нельзя установить значение ${newValue}`);       
            } else {
                value = newValue;
            }
        }
        const getter = function (): number | undefined {
            return value;
        }
        Object.defineProperty(target, propertyKey, {
            set: setter,
            get: getter,
        });
    }
}