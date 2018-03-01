const express = require('express');
const exphbs = require('express-handlebars');
const weatherService = require('./app/services/weatherService');
const CronJob = require('cron').CronJob;
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const bodyParser = require('body-parser');
const redis = require("redis");
const R = require('ramda');
const path = require('path');
const routes = require('./routes/routes');
const errorHandlers = require('./app/handlers/errorHandlers');

// Import environmental variables from .env file
require('dotenv').config();

// Create Express app
const app = express();

// Socket.IO setup
const server = require('http').Server(app);
const io = require('socket.io')(server);

// View engine setup
app.set('views', path.join(__dirname, 'views')); // Folder for handlebars files
app.engine('handlebars', exphbs({defaultLayout: 'main'})); // Register handlebars template engine
app.set('view engine', 'handlebars'); // Use handlebars view engine

// Serve up static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Turn raw requests into usable properties on req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Session setup
const sessionMiddleware = session({
    store: new RedisStore({
        client: redis.createClient(),
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        ttl: process.env.REDIS_TTL
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
});

app.use(sessionMiddleware);

app.use((req, res, next) => {
    if (!req.session) {
        return next(new Error('Session not available'));
    }

    next();
});

// Handle routes
app.use('/', routes);

// Routes did not work, forward 404 to error handler
app.use(errorHandlers.notFound);

// Development error handler which prints stack trace
if (app.get('env') === 'development') {
    app.use(errorHandlers.developmentErrors);
}

// Production error handler
app.use(errorHandlers.productionErrors);

// Socket.IO
const roomPrefix = process.env.SOCKET_ROOM_PREFIX;

// Use Express session middleware as Socket.IO middleware
io.use(function (socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next);
});

// Handle socket connections
io.on('connection', async (socket) => {
    console.log('user connected');

    if (socket.request.session.location) {
        try {
            socket.join(R.concat(roomPrefix, socket.request.session.location));
            socket.emit('forecasts', await weatherService.getForecastsForLocation(socket.request.session.location));
        } catch (error) {
            console.log(error);
        }
    }

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

// Cron for refreshing clients
// Runs at minute 0 past every 5th hour
const refreshForecasts = new CronJob('0 */5 * * *', async () => {
    console.log('cron for refreshing forecasts is running');

    R.forEachObjIndexed(async (room, key) => {
        if (R.startsWith(roomPrefix, key)) {
            try {
                const forecasts = await weatherService.getForecastsForLocation(R.replace(roomPrefix, '', key));
                io.to(key).emit('forecasts', forecasts);
            } catch (error) {
                console.log(error);
            }
        }
    }, io.sockets.adapter.rooms);
}, null, true, 'Europe/Berlin');

// Start the app!
app.set('port', process.env.PORT);
server.listen(app.get('port'), () => {
    console.log(`Weather app running → PORT ${server.address().port}`);
});
