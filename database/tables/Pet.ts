import { createTable } from '../../src/index';

export default createTable({
    name: 'Pet',
    columns: [
        { name: 'id', type: 'uuid', auto: true },
        { name: 'userId', type: 'uuid' },
        { name: 'name', type: 'string' },
        { name: 'type', type: 'enum', values: ['dog', 'cat', 'fish'] },
    ],
    indexes: [
        { type: 'primary', column: 'id' },
    ],
    foreignKeys: [
        { table: 'User', id: 'id', column: 'userId', onUpdateDelete: 'cascade' },
    ],
});
