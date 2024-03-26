const mySchema = {
    tables: [
        {
            name: 'Address',
            columns: [
                { name: 'id', type: 'uuid', auto: true },
                { name: 'userId', type: 'uuid' },
                { name: 'name', type: 'string', nullable: true },
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
} as const;

type Schema = typeof mySchema;
type Table = Schema['tables'][number];
type Column = Table['columns'][number];

type TypeMapping = {
    boolean: boolean;
    date: Date;
    datetime: Date;
    enum: string;
    integer: number;
    string: string;
    text: string;
    time: Date;
    uuid: string;
};

type ColumnType<T extends Column> = T extends { type: 'enum', values: readonly string[] }
    ? T['values'][number]
    : TypeMapping[T['type']];

type NullableType<T extends Column> = T extends { nullable: true }
    ? ColumnType<T> | null
    : ColumnType<T>;

type TableType<T extends Table> = {
    [K in T['columns'][number]['name']]: NullableType<Extract<T['columns'][number], { name: K }>>
};

type User = TableType<Extract<Table, { name: 'User' }>>;
type Address = TableType<Extract<Table, { name: 'Address' }>>;
type Pet = TableType<Extract<Table, { name: 'Pet' }>>;

const address: Address = {
    id: 'a-uuid',
    userId: 'a-uuid',
    name: null,
    city: 'a-string',
};

const pet: Pet = {
    id: 'a-uuid',
    userId: 'a-uuid',
    name: 'a-string',
    type: 'dog',
};

const user: User = {
    id: 'a-uuid',
    name: 'a-string',
};
