const getArgs = (args) => {
    const res = {};
    args.slice(2).forEach((value, index, array) => {
        if (value.startsWith('-')) {
            const key = value.substring(1);
            const nextValue = array[index + 1];

            res[key] = nextValue && !nextValue.startsWith('-') ? nextValue : true;
        }
    });
    return res;
};

export { getArgs };