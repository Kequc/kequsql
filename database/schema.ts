import 'dotenv/config';
import { createSchema } from '../src/index';

import Address from './tables/Address';
import Pet from './tables/Pet';
import User from './tables/User';

export default createSchema({
    tables: [
        Address,
        Pet,
        User,
    ],
});
