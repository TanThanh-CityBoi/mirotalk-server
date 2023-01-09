const mongoose = require("mongoose");
const { SOCKET_MESSAGE } = require("../utils/constant");
const User = require("../models/user");
const Room = require("../models/room");
const Message = require("../models/message");
const { isEmpty } = require("lodash");

module.exports = (io) => {
  io.on("connection", (socket) => {
    socket.on(SOCKET_MESSAGE.JOIN_ROOM, async ({ roomCode }) => {
      socket.join(roomCode);

      const userConnected = await User.findOne({ socketId: socket.id })
      socket.to(roomCode).emit(SOCKET_MESSAGE.USER_CONNECTED, userConnected);

      socket.on("disconnect", async () => {
        console.log("someone disconnected: " + socket.id);
        await deleteUser(roomId, socket.id);
        io.to(roomCode).emit(SOCKET_MESSAGE.USER_DISCONNECTED, socket.id);
      });
    });

    socket.on(SOCKET_MESSAGE.SEND_MESSAGE, async ({ roomCode, message }) => {
      const [sender, room] = await Promise.all([
        User.findOne({ socketId: socket.id }),
        Room.findOne({ code: roomCode }),
      ]);
      if (isEmpty(sender && room)) return;
      const newMessage = new Message({
        content: message,
        sender: sender._id,
      });
      await Promise.all([
        newMessage.save(),
        Room.updateOne(
          { code: roomCode },
          { $set: { messages: [...room.messages, newMessage._id] } }
        ),
      ]);
      io.to(roomCode).emit(SOCKET_MESSAGE.RECEIVE_MESSAGE, {
        content: message,
        sender,
      });
    });
  });

  const deleteUser = async ({ roomCode, socketId }) => {
    try {
      const [room, user] = await Promise.all([
        Room.findOne({ code: roomId }).exec(),
        User.findOne({ socketId })
      ])
      if (isEmpty(room)) return [false, "DELETE_FAIL"];
      const members = room.members.filter(
        (val) => val.toString() != user._id.toString()
      );

      // delete room
      if (members.length === 0) {
        await Promise.all([
          Room.deleteOne({ code: roomCode }),
          User.deleteOne({ _id: user._id }),
          Message.deleteMany({ _id: { $in: roomCode.messages } })
        ]);
        return [true, "SUCCESS"];
      }

      // update room
      if (room.host.toString() == user._id.toString()) {
        room.host = members[0];
      }
      await Room.updateOne(
        { code: roomCode },
        { $set: { members, host: room.host } }
      ).exec()
      return [true, "SUCCESS"];
    } catch (err) {
      return [false, "DELETE_FAIL"];
    }
  };
};
