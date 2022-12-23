const cors = require('cors');
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const route = require('./routers/index');
const Logger = require('./common/Logger');
const socket = require('./socket/socket-io.js');
const https = require('httpolyglot');
const fs = require('fs');
const path = require('path');
const config = require('./common/config');


const log = new Logger('Server');
const app = express();
require('dotenv').config();

app.use(cors());
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const options = {
	key: fs.readFileSync(path.join(__dirname, config.sslKey), 'utf-8'),
	cert: fs.readFileSync(path.join(__dirname, config.sslCrt), 'utf-8'),
};
const httpsServer = https.createServer(options, app);
const io = require('socket.io')(httpsServer, {
    maxHttpBufferSize: 1e7,
    transports: ['websocket'],
});

route(app);

httpsServer.listen(config.listenPort, () => {
	log.log(
		`%c

		███████╗██╗ ██████╗ ███╗   ██╗      ███████╗███████╗██████╗ ██╗   ██╗███████╗██████╗ 
		██╔════╝██║██╔════╝ ████╗  ██║      ██╔════╝██╔════╝██╔══██╗██║   ██║██╔════╝██╔══██╗
		███████╗██║██║  ███╗██╔██╗ ██║█████╗███████╗█████╗  ██████╔╝██║   ██║█████╗  ██████╔╝
		╚════██║██║██║   ██║██║╚██╗██║╚════╝╚════██║██╔══╝  ██╔══██╗╚██╗ ██╔╝██╔══╝  ██╔══██╗
		███████║██║╚██████╔╝██║ ╚████║      ███████║███████╗██║  ██║ ╚████╔╝ ███████╗██║  ██║
		╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝      ╚══════╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚══════╝╚═╝  ╚═╝ started...

		`,
		'font-family:monospace',
	);
});
socket(io);
