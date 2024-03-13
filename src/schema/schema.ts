import { TSchemaOptions, TSchemaTableOptions } from '../types';

import booleanColumn from './columns/boolean';
import dateColumn from './columns/date';
import datetimeColumn from './columns/datetime';
import enumColumn from './columns/enum';
import integerColumn from './columns/integer';
import stringColumn from './columns/string';
import textColumn from './columns/text';
import timeColumn from './columns/time';
import uuidColumn from './columns/uuid';

import fulltextIndex from './indexes/fulltext';
import indexIndex from './indexes/index';
import primaryIndex from './indexes/primary';
import uniqueIndex from './indexes/unique';

import cascadeForeignKey from './foreign-keys/cascade';
import noActionForeignKey from './foreign-keys/no-action';
import restrictForeignKey from './foreign-keys/restrict';
import setNullForeignKey from './foreign-keys/set-null';

export const column = {
    boolean: booleanColumn,
    date: dateColumn,
    datetime: datetimeColumn,
    enum: enumColumn,
    integer: integerColumn,
    string: stringColumn,
    text: textColumn,
    time: timeColumn,
    uuid: uuidColumn
};

export const index = {
    fulltext: fulltextIndex,
    index: indexIndex,
    primary: primaryIndex,
    unique: uniqueIndex
};

export const foreignKey = {
    cascade: cascadeForeignKey,
    noAction: noActionForeignKey,
    restrict: restrictForeignKey,
    setNull: setNullForeignKey
};

export function createSchema (schema: TSchemaOptions): TSchemaOptions {
    return schema;
}

export function createTable (table: TSchemaTableOptions): TSchemaTableOptions {
    return table;
}
