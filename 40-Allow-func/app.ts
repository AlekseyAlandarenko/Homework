class User {
    @allowFunc((value) => value > 0)
    age!: number;
}

function allowFunc(validationFn: (value: number) => boolean): PropertyDecorator {
    return (target: Object, propertyKey: string | symbol): void => {
        const privatePropertyKey = Symbol(`_${String(propertyKey)}`);

        Object.defineProperty(target, propertyKey, {
            set: function (this: Record<string | symbol, any>, newValue: number) {
                if (!validationFn(newValue)) {
                    console.error(
                        `Значение "${newValue}" не соответствует условию!`
                    );
                    return;
                }
                this[privatePropertyKey] = newValue;
            },
            get: function (this: Record<string | symbol, any>) {
                return this[privatePropertyKey];
            },
            enumerable: true,
            configurable: true,
        });
    };
}