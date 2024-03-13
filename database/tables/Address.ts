import { createTable, column, index, foreignKey } from '../../src/index';

export default createTable({
    name: 'Address',
    columns: [
        column.uuid     ('id', { auto: true }),
        column.uuid     ('userId', { nullable: false }),
        column.string   ('name', { nullable: false }),
        column.string   ('city', { nullable: false }),
    ],
    indexes: [
        index.primary   ('id'),
        index.unique    ('userId'),
    ],
    foreignKeys: [
        foreignKey.cascade  ('User', 'id', 'userId'),
    ],
});
