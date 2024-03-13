import { createTable, column, index, foreignKey } from '../../src/index';

export default createTable({
    name: 'Pet',
    columns: [
        column.uuid     ('id', { auto: true }),
        column.uuid     ('userId', { nullable: false }),
        column.string   ('name', { nullable: false }),
        column.enum     ('type', ['dog', 'cat', 'fish'], { nullable: false }),
    ],
    indexes: [
        index.primary   ('id'),
    ],
    foreignKeys: [
        foreignKey.cascade  ('User', 'id', 'userId'),
    ]
});
