const { SOCKET_MESSAGE } = require('../utils/constant')
const User = require('../models/user')
const Room = require('../models/room')
const Message = require('../models/message')


module.exports = (io) => {
    io.on('connection', (socket) => {
        socket.on(SOCKET_MESSAGE.JOIN_ROOM, async (roomId, userName) => {
            // create new user
            const newUser = new User({ userName })
            await newUser.save()

            let room = await Room.findOne({ code: roomId })
            if (!room.length) {
                // create new room
                room = new Room({
                    code: roomId,
                    host: newUser._id
                })
                await room.save();
            }
            room.members.push(newUser._id)
            Room.updateOne({ code: roomId }, { $set: { members: room.members } }).exec()
                .then(() => {
                    socket.join(roomId);
                    socket.to(roomId).emit(SOCKET_MESSAGE.USER_CONNECTED, newUser._id)
                })

            socket.on("disconnect", async () => {
                console.log("someone disconnected: " + socket.id)
                const userDisconnect = await deleteUser(roomId, socket.id)
                socket.to(roomId).emit(SOCKET_MESSAGE.USER_DISCONNECTED, userDisconnect?._id)
            })
        })


        socket.on(SOCKET_MESSAGE.SEND_MESSAGE, async ({ roomId, message }) => {
            const sender = await User.findOne({ socketId: socket.id })
            const newMessage = new Message({
                content: message,
                sender: sender._id
            })
            await newMessage.save();
            socket.to(roomId).emit(SOCKET_MESSAGE.RECEIVE_MESSAGE, { message, sender })
        })

    });

    const deleteUser = async (roomId, socketId) => {
        const [userDelete, room] = await Promise.all([
            User.findOne({ socketId }).exec(),
            Room.findOne({ code: roomId }).exec()
        ])
        if (!userDelete.length || !room.length) return

        const members = room.members.filter(val => val.toString() != userDelete._id.toString())
        Room.updateOne({ code: roomId }, { $set: { members } }).exec()
        return userDelete
    }

}