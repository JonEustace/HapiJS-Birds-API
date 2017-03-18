const credentials  = require('./credentials');

module.exports = {
    development: {
        migrations: { tableName: 'knex_migrations' },
        seeds: { tableName: './seeds' },
        client: 'pg',
        connection: {
            host: 'localhost',
            user: credentials.username,
            password: credentials.password,
            database: 'birdbase',
            charset: 'utf8'
        }
    }
};

