import 'dotenv/config';
import kequsql from '../src/index';

import Address from './tables/Address';
import Pet from './tables/Pet';
import User from './tables/User';

export default kequsql({
    connection: process.env.DATABASE_URL!,
    schema: {
        tables: [
            Address,
            Pet,
            User,
        ],
    },
});
