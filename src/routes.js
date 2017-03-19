import Knex from './knex';
import jwt from 'jsonwebtoken';


const routes = [
//GET route for birds
{
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
},
{
    path: '/birds',
    method: 'POST',
    config: {
        auth: {
            strategy: 'token',
        }
    },
    handler: (request, reply) => {
        const {bird} = request.payload;
    }
},
//POST route for authentication
{
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
}];
export default routes;