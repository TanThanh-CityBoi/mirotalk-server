const appRouter = require('./app-router');

function route(app) {
	app.use('/api', appRouter);
}

module.exports = route;
