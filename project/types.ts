import { TFindManyOptions, TFindOptions, TWhereModifier } from '../src/types';

//
// This file is auto-generated do not modify.
//

export type TKey = 'User' | 'Address' | 'Pet';

// MAPS
export type DbTable = { [K in TKey]: DbTableMap[K]; };
export type DbTableOptions = { [K in TKey]: DbTableOptionsMap[K]; };
export type DbTableWhere = { [K in TKey]: DbTableWhereMap[K]; };
export type DbTableSelect = { [K in TKey]: DbTableSelectMap[K]; };
export type DbTableInclude = { [K in TKey]: DbTableIncludeMap[K]; };

interface DbTableMap {
    User: DbUser;
    Address: DbAddress;
    Pet: DbPet;
}

interface DbTableOptionsMap {
    User: DbUserOptions;
    Address: DbAddressOptions;
    Pet: DbPetOptions;
}

interface DbTableWhereMap {
    User: DbUserWhere;
    Address: DbAddressWhere;
    Pet: DbPetWhere;
}

interface DbTableSelectMap {
    User: DbUserSelect;
    Address: DbAddressSelect;
    Pet: DbPetSelect;
}

interface DbTableIncludeMap {
    User: DbUserInclude;
    Address: DbAddressInclude;
    Pet: DbPetInclude;
}

// TABLES
export interface DbUser {
    id: string;
    name: string | null;
    address?: DbAddress;
    pets?: DbPet[];
}

export interface DbAddress {
    id: string;
    name: string;
    city: string;
}

export interface DbPet {
    id: string;
    name: string;
    type: 'dog' | 'cat' | 'fish';
}

// OPTIONS
export interface DbUserOptions {
    id?: string;
    name?: string;
    address?: Omit<DbAddressOptions, 'userId'>;
    pets?: Omit<DbPetOptions, 'userId'>[];
}

export interface DbAddressOptions {
    id?: string;
    name?: string;
    city?: string;
}

export interface DbPetOptions {
    id?: string;
    name?: string;
    type?: 'dog' | 'cat' | 'fish';
}

// WHERE
export interface DbUserWhere {
    id?: TWhereModifier<string>;
    name?: TWhereModifier<string>;
    address?: DbAddressWhere;
    pets?: DbPetWhere;
}

export interface DbAddressWhere {
    id?: TWhereModifier<string>;
    name?: TWhereModifier<string>;
    city?: TWhereModifier<string>;
}

export interface DbPetWhere {
    id?: TWhereModifier<string>;
    name?: TWhereModifier<string>;
    type?: TWhereModifier<'dog' | 'cat' | 'fish'>;
}

// SELECT
export interface DbUserSelect {
    id?: true;
    name?: true;
    address?: true;
    pets?: true;
}

export interface DbAddressSelect {
    id?: true;
    name?: true;
    city?: true;
}

export interface DbPetSelect {
    id?: true;
    name?: true;
    type?: true;
}

// INCLUDE
export interface DbUserInclude {
    address?: TFindOptions<'Address'> | true;
    pets?: TFindManyOptions<'Pet'> | true;
}

export interface DbAddressInclude {
    user?: TFindOptions<'User'> | true;
}

export interface DbPetInclude {
    user?: TFindOptions<'User'> | true;
}
