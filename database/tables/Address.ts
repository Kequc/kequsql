import { createTable } from '../../src/index';

export default createTable({
    name: 'Address',
    columns: [
        { name: 'id', type: 'uuid', auto: true },
        { name: 'userId', type: 'uuid' },
        { name: 'name', type: 'string' },
        { name: 'city', type: 'string' },
    ],
    indexes: [
        { type: 'primary', column: 'id' },
        { type: 'unique', column: 'userId' },
    ],
    foreignKeys: [
        { table: 'User', id: 'id', column: 'userId', onUpdateDelete: 'cascade' },
    ],
});
