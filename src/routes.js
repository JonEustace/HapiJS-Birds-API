import Knex from './knex';
import jwt from 'jsonwebtoken';
import errorHandler from './errorhandler';
import GUID from 'node-uuid';
import {jwtKey} from '../credentials';

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
            const guid = GUID.v4();
            Knex('birds').insert({

                owner: request.auth.credentials.scope,
                name: bird.name,
                species: bird.species,
                picture_url: bird.picture_url,
                guid

            }).then(() => {
                reply({
                    data: guid,
                    message: 'successfully created bird'
                });
            }).catch(err => {
                errorHandler('server-side error', err);
                reply('server-side error', err);
            });
        }
    },
    {
        path: '/birds/{birdGuid}',
        method: 'PUT',
        config: {
            auth: {
                strategy: 'token',
            },
            pre:[
                {
                    method: ( request, reply ) => {
                        const { birdGuid } = request.params
                            , { scope }    = request.auth.credentials;
                        Knex('birds').where({
                            guid: birdGuid,
                        }).select('owner').then(([result]) => {
                            // When there is no matching result in the DB.
                            if(!result) {
                                //reply.takeover overrides the handler with our own custom message.
                                reply({
                                    error: true,
                                    errMessage: `the bird with id ${birdGuid} was not found`
                                }).takeover();
                            }
                            // If the user isn't the owner of the bird record.
                            if(result.owner !== scope ) {

                                reply({
                                    error: true,
                                    errMessage: `the bird with id ${ birdGuid } is not in the current scope`
                                }).takeover();
                            }
                            return reply.continue();
                        });
                    }
                }
            ]
        },
        handler: (request, reply) => {

            const {birdGuid} = request.params
                , {bird}     = request.payload;

            Knex('birds').where({
                guid: birdGuid,
            }).update({

                name: bird.name,
                species: bird.species,
                picture_url: bird.picture_url,
                isPublic: bird.isPublic,

            }).then(() => {
                reply({
                    message: 'successfully updated bird'
                });
            }).catch(() => {
                reply('server-side error');
            });
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
                    },
                        jwtKey,
                        {
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