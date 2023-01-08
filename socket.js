module.exports = (io) => {
    io.on('connection', (socket) => {
        socket.on('createRoom', async ({ room_id }, callback) => { });

        socket.on('join', (data, cb) => { });

        socket.on('exitRoom', async (_, callback) => { });

    });
}