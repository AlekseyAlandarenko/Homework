const getArgs = (args: string[]): Record<string, string | boolean> => {
    const res: Record<string, string | boolean> = {};

    args.slice(2).forEach((value: string, index: number, array: string[]) => {
        if (value.startsWith('-')) {
            const key: string = value.substring(1);
            const nextValue: string | undefined = array[index + 1];

            res[key] = nextValue && !nextValue.startsWith('-') ? nextValue : true;
        }
    });

    return res;
};

export { getArgs };