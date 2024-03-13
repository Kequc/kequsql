import { createTable, column, index } from '../../src/index';

export default createTable({
    name: 'User',
    columns: [
        column.uuid     ('id', { auto: true }),
        column.string   ('name', { nullable: false }),
    ],
    indexes: [
        index.primary   ('id'),
    ]
});
