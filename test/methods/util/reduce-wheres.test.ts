import 'kequtest';
import assert from 'assert';
import reduceWheres from '../../../src/methods/util/reduce-wheres';

it('returns where', () => {
    const where = {
        accountId: 1,
        deletedAt: { isNull: true }
    };

    const result = reduceWheres([
        where
    ]);

    assert.deepStrictEqual(result, where);
});

it('returns undefined', () => {
    const results = [
        reduceWheres([]),
        reduceWheres([{}]),
        reduceWheres([{}, {}]),
        reduceWheres([undefined]),
        reduceWheres([{}]),
        reduceWheres([
            undefined,
            { accountId: 1 }
        ]),
        reduceWheres([
            {},
            { accountId: 1 }
        ])
    ];

    for (const result of results) {
        assert.strictEqual(result, undefined);
    }
});

it('combines wheres', () => {
    const result = reduceWheres([
        { accountId: 1 },
        { accountId: 2 },
        { accountId: 1 },
        { accountId: 3 },
        { accountId: 1 },
        { accountId: 4 },
        { accountId: 4 },
        { accountId: 5 }
    ]);

    assert.deepStrictEqual(result, {
        accountId: { in: [1, 2, 3, 4, 5] }
    });
});

it('combines complex wheres', () => {
    const result = reduceWheres([
        { size: 20, accountId: 1 },
        { size: 20, accountId: 2 },
        { size: 20, accountId: { in: [1, 3, 1, 4] } },
        { size: 20, accountId: 5 }
    ]);

    assert.deepStrictEqual(result, {
        size: 20,
        accountId: { in: [1, 2, 3, 4, 5] }
    });
});

it('combines complex mismatched wheres', () => {
    const result = reduceWheres([
        { size: 20, accountId: 1 },
        { size: 30, accountId: 2 },
        { size: 20, accountId: { in: [1, 3, 1, 4] } },
        { size: 20, accountId: 5 }
    ]);

    assert.deepStrictEqual(result, {
        or: [
            { size: 20, accountId: { in: [1, 3, 4, 5] } },
            { size: 30, accountId: 2 }
        ]
    });
});

it('combines complex mismatched keys', () => {
    const result = reduceWheres([
        { size: 20, accountId: 1 },
        { mimeType: 'text/html', accountId: 2 },
        { size: 20, accountId: { in: [1, 3, 1, 4] } },
        { size: 20, accountId: 5 }
    ]);

    assert.deepStrictEqual(result, {
        or: [
            { size: 20, accountId: { in: [1, 3, 4, 5] } },
            { mimeType: 'text/html', accountId: 2 }
        ]
    });
});

it('combines different wheres', () => {
    const result = reduceWheres([
        { accountId: 1 },
        { accountId: 2 },
        { accountId: 1 },
        { accountId: 3 },
        { userId: 1 },
        { userId: 4 },
        { userId: 4 },
        { userId: 5 }
    ]);

    assert.deepStrictEqual(result, {
        or: [
            { accountId: { in: [1, 2, 3] } },
            { userId: { in: [1, 4, 5] } }
        ]
    });
});

it('combines nested wheres', () => {
    const result = reduceWheres([
        { or: [{ size: 20 }, { accountId: 1 }] },
        { or: [{ size: 20 }, { accountId: 2 }] },
        { or: [{ size: 20 }, { accountId: { in: [1, 3, 1, 4] } }] },
        { or: [{ size: 20 }, { accountId: 5 }] }
    ]);

    assert.deepStrictEqual(result, {
        or: [
            { size: 20 },
            { accountId: { in: [1, 2, 3, 4, 5] } }
        ]
    });
});


it('combines nested mismatched wheres', () => {
    const result = reduceWheres([
        { or: [{ size: 20 }, { accountId: 1 }] },
        { or: [{ size: 30 }, { accountId: 2 }] },
        { or: [{ size: 20 }, { accountId: { in: [1, 3, 1, 4] } }] },
        { or: [{ size: 20 }, { accountId: 5 }] }
    ]);

    assert.deepStrictEqual(result, {
        or: [
            { size: { in: [20, 30] } },
            { accountId: { in: [1, 2, 3, 4, 5] } }
        ]
    });
});

it('combines nested mismatched keys', () => {
    const result = reduceWheres([
        { or: [{ size: 20 }, { accountId: 1 }] },
        { or: [{ mimeType: 'text/html' }, { accountId: 2 }] },
        { or: [{ size: 20 }, { accountId: { in: [1, 3, 1, 4] } }] },
        { or: [{ size: 20 }, { accountId: 5 }] }
    ]);

    assert.deepStrictEqual(result, {
        or: [
            { size: 20 },
            { accountId: { in: [1, 2, 3, 4, 5] } },
            { mimeType: 'text/html' }
        ]
    });
});

it('combines wheres with modifiers', () => {
    const result = reduceWheres([
        { userId: 1 },
        { userId: { in : [3, 4, 5], lte: 4 } },
        { accountId: { in: [1, 2, 3], lte: 4 } },
        { userId: { in: [1, 4], lt: 5 } },
        { userId: { in: [4, 5], lt: 5 } },
        { userId: { in: [5, 6], lt: 5, gte: 3 } },
        { userId: { in: [7, 8], lt: 5, gte: 3 } }
    ]);

    assert.deepStrictEqual(result, {
        or: [
            { or: [
                { userId: 1 },
                { userId: { in: [3, 4, 5], lte: 4 } },
                { userId: { in: [1, 4, 5], lt: 5 } },
                { userId: { in: [5, 6, 7, 8], lt: 5, gte: 3 } }
            ] },
            { accountId: { in: [1, 2, 3], lte: 4 } }
        ]
    });
});

it('combines ands', () => {
    const result = reduceWheres([
        { and: [{ size: 20 }, { accountId: 2 }] },
        { and: [{ size: 20 }, { accountId: 6 }] }
    ]);

    assert.deepStrictEqual(result, {
        and: [{ size: 20 }, { accountId: { in: [2, 6] } }]
    });
});

it('combines nested mixed wheres', () => {
    const result = reduceWheres([
        { or:  [{ size: 20 }, { accountId: 1 }] },
        { and: [{ size: 20 }, { accountId: 2 }] },
        { or:  [{ size: 20 }, { accountId: { in: [1, 3, 1, 4] } }] },
        { or:  [{ size: 20 }, { accountId: 5 }] },
        { and: [{ size: 20 }, { accountId: 6 }] }
    ]);

    assert.deepStrictEqual(result, {
        or: [
            { or:  [{ size: 20 }, { accountId: { in: [1, 3, 4, 5] } }] },
            { and: [{ size: 20 }, { accountId: { in: [2, 6] } }] }
        ]
    });
});

it('combines deeply nested wheres "or"', () => {
    const result = reduceWheres([
        { or: [{ size: 20 }, { accountId: 1 }] },
        { or: [
            { and: [{ size: 20 }, { accountId: 2 }] },
            { and: [{ size: 20 }, { accountId: 6 }] },
            { and: [{ size: 30 }, { accountId: 6 }] }
        ] },
        { or: [{ size: 20 }, { accountId: { in: [1, 3, 1, 4] } }] },
        { or: [{ size: 20 }, { accountId: 5 }] }
    ]);

    assert.deepStrictEqual(result, {
        or: [
            { size: 20 },
            { accountId: { in: [ 1, 3, 4, 5 ] } },
            { or: [
                { and: [{ size: 20 }, { accountId: { in: [2, 6] } }] },
                { and: [{ size: 30 }, { accountId: 6 }] }
            ] }
        ]
    });
});

it('combines deeply nested wheres "and"', () => {
    const result = reduceWheres([
        { and: [{ size: 20 }, { accountId: 1 }] },
        { and: [
            { or: [{ size: 20 }, { accountId: 2 }] },
            { or: [{ size: 20 }, { accountId: 6 }] },
            { or: [{ size: 30 }, { accountId: 6 }] }
        ] },
        { and: [{ size: 20 }, { accountId: { in: [1, 3, 1, 4] } }] },
        { and: [{ size: 20 }, { accountId: 5 }] }
    ]);

    assert.deepStrictEqual(result, {
        or: [
            { and: [{ size: 20 }, { accountId: { in: [1, 3, 4, 5] } }] },
            { and: [
                { or: [{ size: 20 }, { accountId: 2 }] },
                { or: [{ size: 20 }, { accountId: 6 }] },
                { or: [{ size: 30 }, { accountId: 6 }] }
            ] }
        ]
    });
});

it('combines weird deeply nested wheres "and"', () => {
    const result = reduceWheres([
        { and: [{ size: 20 }, { accountId: 1 }] },
        { and: [
            { or: [{ size: 30 }, { accountId: 6 }] },
            { or: [{ size: 20 }, { accountId: 2 }] },
            { or: [{ size: 20 }, { accountId: 6 }] }
        ] },
        { and: [{ size: 30 }, { accountId: { in: [1, 3, 1, 4] } }] },
        { and: [{ size: 20 }, { accountId: 5 }] }
    ]);

    assert.deepStrictEqual(result, {
        or: [
            { and: [{ size: 20 }, { accountId: { in: [1, 5] } }] },
            { and: [{ size: 30 }, { accountId: { in: [1, 3, 1, 4] } }] },
            { and: [
                { or: [{ size: 30 }, { accountId: 6 }] },
                { or: [{ size: 20 }, { accountId: 2 }] },
                { or: [{ size: 20 }, { accountId: 6 }] }
            ] }
        ]
    });
});
