import 'kequtest';
import assert from 'assert';
import prepareFind from '../../../src/methods/find/prepare-find';
import { TSchemaTableOptions } from '../../../src/schema/schema-types';
import { TInternal } from '../../../src/types';
import getSchema from '../../../src/schema/get-schema';

function generateInternal (tables: TSchemaTableOptions[] = []): TInternal {
    return {
        query: util.spy(),
        transaction: util.spy(),
        sql: {
            dialect: 'mysql',
            q: util.spy(value => `\`${value}\``),
            renderColumnType: util.spy(column => column.type),
        },
        schema: getSchema({
            connection: 'connection',
            schema: { tables },
        }),
        getTable: util.spy(),
    };
}

function s(...parts: string[]) {
    return parts.join('\n') + ';';
}

it('simple select statement', () => {
    const db = generateInternal([{
        name: 'User',
        columns: [{ name: 'id', type: 'integer', auto: true }],
        indexes: [{ type: 'primary', column: 'id' }],
    }]);
    const tables = db.schema.tables;
    const options: any = {};
    const result = prepareFind(db, tables[0], options);

    assert.strictEqual(result.rendered, s(
        "SELECT t0.`id` t0_0",
        "FROM `User` t0",
    ));
    assert.deepStrictEqual(result.values, []);
    assert.deepStrictEqual(result.strategy, [{
        table: tables[0],
        breadcrumb: [],
        columns: tables[0].columns,
        relations: [],
        parentTable: undefined,
    }]);
});

it('where clause', () => {
    const db = generateInternal([{
        name: 'User',
        columns: [{ name: 'id', type: 'integer', auto: true }],
        indexes: [{ type: 'primary', column: 'id' }],
    }]);
    const tables = db.schema.tables;
    const options: any = { where: { id: 1 } };
    const result = prepareFind(db, tables[0], options);

    assert.strictEqual(result.rendered, s(
        "SELECT t0.`id` t0_0",
        "FROM `User` t0",
        "WHERE t0.`id` = ?",
    ));
    assert.deepStrictEqual(result.values, [1]);
    assert.deepStrictEqual(result.strategy, [{
        table: tables[0],
        breadcrumb: [],
        columns: tables[0].columns,
        relations: [],
        parentTable: undefined,
    }]);
});

it('simple select with limit offset and order by', () => {
    const db = generateInternal([{
        name: 'User',
        columns: [{ name: 'id', type: 'integer', auto: true }],
        indexes: [{ type: 'primary', column: 'id' }],
    }]);
    const tables = db.schema.tables;
    const options: any = { limit: 10, offset: 5, orderBy: { id: 'desc' } };
    const result = prepareFind(db, tables[0], options);

    assert.strictEqual(result.rendered, s(
        "SELECT t0.`id` t0_0",
        "FROM `User` t0",
        "ORDER BY t0.`id` DESC",
        "LIMIT 10 OFFSET 5",
    ));
    assert.deepStrictEqual(result.values, []);
});

it('where clause in a joining table', () => {
    const db = generateInternal([{
        name: 'User',
        columns: [{ name: 'id', type: 'integer', auto: true }],
        indexes: [{ type: 'primary', column: 'id' }],
    }, {
        name: 'Post',
        columns: [
            { name: 'id', type: 'integer', auto: true },
            { name: 'userId', type: 'integer' },
        ],
        indexes: [{ type: 'primary', column: 'id' }],
        foreignKeys: [{ table: 'User', id: 'id', column: 'userId' }],
    }]);
    const tables = db.schema.tables;
    const options: any = { where: { posts: { id: 1 } } };
    const result = prepareFind(db, tables[0], options);

    assert.strictEqual(result.rendered, s(
        "SELECT t0.`id` t0_0",
        "FROM `User` t0",
        "JOIN `Post` t1",
        "ON t0.`id` = t1.`userId`",
        "WHERE t1.`id` = ?",
    ));
    assert.deepStrictEqual(result.values, [1]);
});

it('where clause in a joining table and a where clause in the main table', () => {
    const db = generateInternal([{
        name: 'User',
        columns: [{ name: 'id', type: 'integer', auto: true }],
        indexes: [{ type: 'primary', column: 'id' }],
    }, {
        name: 'Post',
        columns: [
            { name: 'id', type: 'integer', auto: true },
            { name: 'userId', type: 'integer' },
        ],
        indexes: [{ type: 'primary', column: 'id' }],
        foreignKeys: [{ table: 'User', id: 'id', column: 'userId' }],
    }]);
    const tables = db.schema.tables;
    const options: any = { where: { id: 1, posts: { id: 2 } } };
    const result = prepareFind(db, tables[0], options);

    assert.strictEqual(result.rendered, s(
        "SELECT t0.`id` t0_0",
        "FROM `User` t0",
        "JOIN `Post` t1",
        "ON t0.`id` = t1.`userId`",
        "WHERE t0.`id` = ? AND t1.`id` = ?",
    ));
    assert.deepStrictEqual(result.values, [1, 2]);
});

it('selects from two tables', () => {
    const db = generateInternal([{
        name: 'User',
        columns: [{ name: 'id', type: 'integer', auto: true }],
        indexes: [{ type: 'primary', column: 'id' }],
    }, {
        name: 'Address',
        columns: [
            { name: 'id', type: 'integer', auto: true },
            { name: 'userId', type: 'integer' },
        ],
        indexes: [
            { type: 'primary', column: 'id' },
            { type: 'unique', column: 'userId' },
        ],
        foreignKeys: [{ table: 'User', id: 'id', column: 'userId' }],
    }]);
    const tables = db.schema.tables;
    const options: any = { include: { address: true } };
    const result = prepareFind(db, tables[0], options);

    assert.strictEqual(result.rendered, s(
        "SELECT t0.`id` t0_0, t1.`id` t1_0, t1.`userId` t1_1",
        "FROM `User` t0",
        "JOIN `Address` t1",
        "ON t0.`id` = t1.`userId`",
    ));
    assert.deepStrictEqual(result.values, []);
});

it('selects from two tables and has a where clause', () => {
    const db = generateInternal([{
        name: 'User',
        columns: [{ name: 'id', type: 'integer', auto: true }],
        indexes: [{ type: 'primary', column: 'id' }],
    }, {
        name: 'Address',
        columns: [
            { name: 'id', type: 'integer', auto: true },
            { name: 'userId', type: 'integer' },
        ],
        indexes: [
            { type: 'primary', column: 'id' },
            { type: 'unique', column: 'userId' },
        ],
        foreignKeys: [{ table: 'User', id: 'id', column: 'userId' }],
    }]);
    const tables = db.schema.tables;
    const options: any = { where: { id: 1 }, include: { address: true } };
    const result = prepareFind(db, tables[0], options);

    assert.strictEqual(result.rendered, s(
        "SELECT t0.`id` t0_0, t1.`id` t1_0, t1.`userId` t1_1",
        "FROM `User` t0",
        "JOIN `Address` t1",
        "ON t0.`id` = t1.`userId`",
        "WHERE t0.`id` = ?",
    ));
    assert.deepStrictEqual(result.values, [1]);
});

it('selectes from a deeply nested table', () => {
    const db = generateInternal([{
        name: 'User',
        columns: [{ name: 'id', type: 'integer', auto: true }],
        indexes: [{ type: 'primary', column: 'id' }],
    }, {
        name: 'Address',
        columns: [
            { name: 'id', type: 'integer', auto: true },
            { name: 'userId', type: 'integer' },
            { name: 'countryId', type: 'integer' },
        ],
        indexes: [
            { type: 'primary', column: 'id' },
            { type: 'unique', column: 'userId' },
        ],
        foreignKeys: [
            { table: 'User', id: 'id', column: 'userId' },
            { table: 'Country', id: 'id', column: 'countryId' },
        ],
    }, {
        name: 'Country',
        columns: [
            { name: 'id', type: 'integer', auto: true },
            { name: 'name', type: 'string' },
        ],
        indexes: [{ type: 'primary', column: 'id' }],
    }]);
    const tables = db.schema.tables;
    const options: any = { include: { address: { include: { country: true } } } };
    const result = prepareFind(db, tables[0], options);

    assert.strictEqual(result.rendered, s(
        "SELECT t0.`id` t0_0, t1.`id` t1_0, t1.`userId` t1_1, t1.`countryId` t1_2, t2.`id` t2_0, t2.`name` t2_1",
        "FROM `User` t0",
        "JOIN `Address` t1",
        "ON t0.`id` = t1.`userId`",
        "JOIN `Country` t2",
        "ON t1.`countryId` = t2.`id`",
    ));
    assert.deepStrictEqual(result.values, []);
});
