import {username, password} from '../credentials';

export default require('knex')({
    client: 'pg',
    connection: {
        host: 'localhost',
        user: username,
        password: password,
        database: 'birdbase',
        charset: 'utf8',
    }
});