// stores instances in global to prevent memory leaks in development

export default function devWrapper<T>(name: string, initialize: () => T): T {
    if (process.env.NODE_ENV === 'development') {
        if (!(name in global)) {
            // @ts-ignore
            global[name] = initialize();
        }

        // @ts-ignore
        return global[name];
    }

    return initialize();
};
