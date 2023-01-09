const mongoose = require('mongoose');
const { SOCKET_MESSAGE } = require('../utils/constant')
const User = require('../models/user')
const Room = require('../models/room')
const Message = require('../models/message')


module.exports = (io) => {
    io.on('connection', (socket) => {
        socket.on(SOCKET_MESSAGE.JOIN_ROOM, async (roomId, userId) => {

            socket.join(roomId);
            socket.to(roomId).emit(SOCKET_MESSAGE.USER_CONNECTED, userId)

            socket.on("disconnect", async () => {
                console.log("someone disconnected: " + userId)
                await deleteUser(roomId, userId)
                socket.to(roomId).emit(SOCKET_MESSAGE.USER_DISCONNECTED, userId)
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

    const deleteUser = async (roomId, userId) => {
        var userObjID = new mongoose.Types.ObjectId(userId);
        const room = await Room.findOne({ code: roomId }).exec()
        if (!room.length) return
        const members = room.members.filter(val => val.toString() != userObjID.toString())
        Room.updateOne({ code: roomId }, { $set: { members } }).exec()
    }

}