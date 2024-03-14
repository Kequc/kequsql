import { TConnectionAttrs, TScheme } from '../types';

const CONNECTION_STRING = new RegExp(
    "^\\s*" + // Optional whitespace padding at the beginning of the line
    "([^:]+)://" + // Scheme (Group 1)
    "(?:([^:@,/?=&]+)(?::([^:@,/?=&]+))?@)?" + // User (Group 2) and Password (Group 3)
    "([^@/?=&]+)" + // Host address(es) (Group 4)
    "(?:/([^:@,/?=&]+)?)?" + // Endpoint (Group 5)
    "(?:\\?([^:@,/?]+)?)?" + // Options (Group 6)
    "\\s*$", // Optional whitespace padding at the end of the line
    "gi");

export default function getConnectionAttrs (connection: string | TConnectionAttrs): TConnectionAttrs {
    if (typeof connection === 'string') {
		if (!connection.includes("://")) {
			throw new Error(`No scheme found: ${connection}`);
		}

        try {
            const tokens = CONNECTION_STRING.exec(connection)!;
            const address = tokens[4].split(",")[0];

            return {
                scheme: parseScheme(tokens[1]),
                user: tokens[2] ? decodeURIComponent(tokens[2]) : tokens[2],
                password: tokens[3] ? decodeURIComponent(tokens[3]) : tokens[3],
                host: decodeURIComponent(parseHost(address)),
                port: parsePort(address),
                database: tokens[5] ? decodeURIComponent(tokens[5]) : tokens[5]
            };
        } catch (error) {
            throw new Error(`Unable to parse: ${connection}`);
        }
    }

    return {
        scheme: parseScheme(connection.scheme),
        user: connection.user,
        password: connection.password,
        host: connection.host,
        port: connection.port,
        database: connection.database
    };
}

function parseScheme (scheme: string): TScheme {
    switch (scheme) {
        case 'mariadb':
        case 'mysql':
        case 'mysql2':
        case 'mysqlx':
        case 'percona':
            return 'mysql';
        case 'postgresql':
        case 'postgres':
        case 'pg':
        case 'cockroachdb':
            return 'postgres';
        default: throw new Error(`Unknown scheme: ${scheme}`);
    }
}

function parseHost (address: string): string {
    const i = address.indexOf(":");
    return i >= 0 ? address.substring(0, i) : address;
}

function parsePort (address: string): number | undefined {
    const i = address.indexOf(":");
    return i >= 0 ? Number(address.substring(i + 1)) : undefined;
}
