const mongoose = require('mongoose');
const { SOCKET_MESSAGE } = require('../utils/constant')
const User = require('../models/user')
const Room = require('../models/room')
const Message = require('../models/message')
const { isEmpty } = require('lodash')


module.exports = (io) => {
    io.on('connection', (socket) => {
        socket.on(SOCKET_MESSAGE.JOIN_ROOM, async (roomCode, userId) => {
            socket.join(roomCode);

            const [room, userConnected] = await Promise.all([
                Room.findOne({ code: roomCode }).populate("members").exec(),
                User.findOne({ _id: userId })
            ])
            io.to(roomCode).emit(SOCKET_MESSAGE.USER_CONNECTED, userConnected)
            io.to(userConnected.socketId).emit(SOCKET_MESSAGE.JOINED_ROOM, room)

            socket.on("disconnect", async () => {
                console.log("someone disconnected: " + userId)
                await deleteUser(roomId, userId)
                io.to(roomCode).emit(SOCKET_MESSAGE.USER_DISCONNECTED, userId)
            })
        })

        socket.on(SOCKET_MESSAGE.SEND_MESSAGE, async ({ roomCode, message }) => {
            const [sender, room] = await Promise.all([
                User.findOne({ socketId: socket.id }),
                Room.findOne({ code: roomCode })
            ])
            if (isEmpty(sender && room)) return
            const newMessage = new Message({
                content: message,
                sender: sender._id
            })
            await Promise.all([
                newMessage.save(),
                Room.updateOne({ code: roomCode }, { $set: { messages: [...room.messages, newMessage._id] } })
            ])
            io.to(roomId).emit(SOCKET_MESSAGE.RECEIVE_MESSAGE, { message, sender })
        })
    });

    const deleteUser = async (roomCode, userId) => {
        var userObjID = new mongoose.Types.ObjectId(userId);
        try {
            const room = await Room.findOne({ code: roomId }).exec()
            if (isEmpty(room)) return [false, 'DELETE_FAIL']
            const members = room.members.filter(val => val.toString() != userObjID.toString())
            if (members.length === 0) {
                await Promise.all([
                    Room.deleteOne({ code: roomCode }),
                    User.deleteOne({ _id: userId })
                ])
                return [true, 'SUCCESS']
            }
            if (room.host.toString() == userObjID.toString()) {
                room.host = members[0]
            }
            await Promise.all([
                Room.updateOne({ code: roomCode }, { $set: { members, host: room.host } }).exec(),
                User.deleteOne({ _id: userId })
            ])
            return [true, 'SUCCESS']
        }
        catch (err) {
            return [false, 'DELETE_FAIL']
        }

    }
}