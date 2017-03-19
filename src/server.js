import Hapi from 'hapi';
import {jwtKey} from '../credentials';
import Knex from './knex';
import jwt from 'jsonwebtoken';

const server = new Hapi.Server();

server.connection({
    port: 8080
});

// .register(...) registers a module within the instance of the API.
// The callback is then used to tell that the loaded module will be used as an authentication strategy.
server.register(require('hapi-auth-jwt'), err => {
    if (err) {
        errorHandler(err);
    }
    server.auth.strategy('token', 'jwt', {
        key: jwtKey,
        verifyOptions: {
            algorithms: ['HS256'],
        }
    });
});

//GET route for birds
server.route({

    path: '/birds',
    method: 'GET',
    handler: (request, reply) => {

        // In general, the Knex operation is like Knex('TABLE_NAME').where(...).chainable(...).then(...)
        Knex('birds').where({
            isPublic: true
        }).select('name', 'species', 'picture_url').then(results => {
            if (!results || results.length === 0) {
                reply({
                    error: true,
                    errMessage: 'no public bird found',
                });
            }
            reply({
                dataCount: results.length,
                data: results,
            });
        }).catch(err => {
            reply(`server-side error: ${err}`);
            errorHandler('server-side error:', err);
        });
    }
});

//POST route for authentication
server.route({
    path: '/auth',
    method: 'POST',
    handler: (request, reply) => {
        const {username, password} = request.payload;
        Knex('users')
            .where({username})
            .select('guid', 'password').then(([user]) => {
            if (!user) {
                reply({
                    error: true,
                    errMessage: 'the specified user was not found',
                });
                // We don't want to wrap everything else in an `else` block, better to just return the control.
                return;
            }
            //TODO: Use salted-hashing algorithm to compare.
            if (user.password === password) {
                const token = jwt.sign({
                    // You can have anything you want here. ANYTHING. This decoded token will be passed onto a request handler.
                    username,
                    scope: user.guid,
                }, 'vZiYpmTzqXMp8PpYXKwqc9ShQ1UhyAfy', {
                    algorithm: 'HS256',
                    expiresIn: '1h',
                });
                reply({
                    token,
                    scope: user.guid,
                });
            } else {
                reply('incorrect password');
            }
        }).catch(err => {
            reply(`server-side error: ${err}`);
            errorHandler('server-side error:', err);
        });
    }
});

server.start(err => {

    if (err) {
        errorHandler('error starting server: ', err);
    }

    console.log(`Server started at ${ server.info.uri }
    Protocol: ${server.info.protocol}
    `);
});

function errorHandler(message, err) {
    console.error(message, err);
}