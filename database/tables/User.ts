import { createTable } from '../../src/index';

export default createTable({
    name: 'User',
    columns: [
        { name: 'id', type: 'uuid', auto: true },
        { name: 'name', type: 'string' },
    ],
    indexes: [
        { type: 'primary', column: 'id' },
    ],
});
