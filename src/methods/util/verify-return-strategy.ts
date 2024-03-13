export function verifyCreateReturn(options: any, table: any) {
    if (!options.skipReturn && !table.returnStrategy.increment && !table.returnStrategy.unique) {
        console.warn(`Table '${table.name}' has no return strategy. This means you must define a primary, unique, or autoincrement column on the table, or should set 'skipReturn' to true.`);
    }
}

export function verifyUpdateReturn(options: any, table: any) {
    if (!options.skipReturn && !table.returnStrategy.unique) {
        console.warn(`Table '${table.name}' has no return strategy. This means you must define a primary, or unique column on the table, or should set 'skipReturn' to true.`);
    }
}
