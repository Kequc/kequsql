import 'dotenv/config';
import { createSchema } from '../src/index';

export default createSchema({
    tables: [
        {
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
        },
        {
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
        },
        {
            name: 'User',
            columns: [
                { name: 'id', type: 'uuid', auto: true },
                { name: 'name', type: 'string' },
            ],
            indexes: [
                { type: 'primary', column: 'id' },
            ],
        },
    ],
});
