import Hapi from 'hapi';
import {jwtKey} from '../credentials';
import jwt from 'jsonwebtoken';
import routes from './routes';
import errorHandler from './errorhandler';

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
    // This is moved inside the callback to ensure that we have loaded the auth module prior to attaching the routes.
    routes.forEach(route => {
        console.log(`attaching ${route.path}`);
        server.route(route);
    });
});



server.start(err => {
    if (err) {
        errorHandler('error starting server: ', err);
    }
    console.log(`Server started at ${ server.info.uri } Protocol: ${server.info.protocol}`);
});

