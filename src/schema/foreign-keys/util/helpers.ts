export function validateColumns (columns: string[], ids: string[]) {
    if (columns.length !== ids.length) {
        throw new Error(`Columns length (${columns.length}) must be equal to ids length (${ids.length})`);
    }
}
