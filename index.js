require('dotenv').config();
const cors = require('cors');
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const https = require('http');
const socket = require('./common/socket')
const { blueBright } = require('chalk')
const appRouter = require('./routers/appRouter')
const connectDB = require('./common/mongoDB')


const app = express();

app.use(cors());
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const httpsServer = https.createServer(app);
const io = require('socket.io')(httpsServer, {
	cors: {
        origin: '*',
        methods: ["GET", "POST"],
        allowedHeaders: ["origin, x-requested-with, content-type"],
        credentials: true
    }
});

// API
// ==============================================================
app.use('/', appRouter);

httpsServer.listen(process.env.PORT || 3003, () => {
	console.log(blueBright.bold(`SERVER STARTED ON PORT: ${process.env.PORT}`));
});

connectDB();
socket(io);