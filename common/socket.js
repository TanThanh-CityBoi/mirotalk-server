const { SOCKET_MESSAGE } = require("../utils/constant");
const User = require("../models/user");
const Room = require("../models/room");
const Message = require("../models/message");
const { yellowBright } = require("chalk");
const { isEmpty } = require("lodash");
const { writeFile } = require("fs");
var path = require('path');

module.exports = (io) => {
  io.on("connection", (socket) => {
    socket.on(SOCKET_MESSAGE.JOIN_ROOM, async ({ roomCode }) => {
      socket.join(roomCode);

      const userConnected = await User.findOne({ socketId: socket.id });
      socket.to(roomCode).emit(SOCKET_MESSAGE.USER_CONNECTED, userConnected);

      socket.on("disconnect", async () => {
        console.log(yellowBright("someone disconnected: " + socket.id));
        const [isSuccess, user] = await deleteUser({
          roomCode,
          socketId: socket.id,
        });
        if (isSuccess)
          io.to(roomCode).emit(SOCKET_MESSAGE.USER_DISCONNECTED, user);
      });
    });

    socket.on("reconnect", async ({ roomCode }) => {
      socket.join(roomCode);
      //
      const room = await Room.findOne({ code: roomCode }).exec();
      if (isEmpty(room)) return;
      //
      const userReconnect = await User.findOne({ socketId: socket.id });
      if (isEmpty(userReconnect)) return;
      //
      const disconnectUsers = room.disconnectUsers.filter(
        (val) => val.toString() != userReconnect._id.toString()
      );
      if (disconnectUsers.length === room.disconnectUsers.length) return;
      //
      await Room.updateOne(
        { code: roomCode },
        { $set: { disconnectUsers } }
      ).exec();
      const roomInfo = await Room.findOne({ code: roomCode })
        .populate("members")
        .populate("host")
        .populate({
          path: "messages",
          populate: { path: "sender", model: "user" },
        })
        .exec();
      socket.to(socket.id).emit(SOCKET_MESSAGE.RECONNECTED, roomInfo);
      socket.to(roomCode).emit(SOCKET_MESSAGE.USER_RECONNECTED, userReconnect);
    });

    socket.on(SOCKET_MESSAGE.SEND_MESSAGE, async ({ message }) => {
      const [sender, room] = await Promise.all([
        User.findOne({ socketId: socket.id }),
        getRoomBySocketId(socket.id),
      ]);
      if (isEmpty(sender && room)) return;
      const newMessage = new Message({
        content: message,
        sender: sender._id,
      });
      await Promise.all([
        newMessage.save(),
        Room.updateOne(
          { code: room.code },
          { $set: { messages: [...room.messages, newMessage._id] } }
        ),
      ]);
      io.to(room.code).emit(SOCKET_MESSAGE.RECEIVE_MESSAGE, {
        content: message,
        sender,
      });
    });

    socket.on(SOCKET_MESSAGE.CALL_USER, async ({ offer, toSocketId }) => {
      const [user, room] = await Promise.all([
        User.findOne({ socketId: socket.id }).exec(),
        getRoomBySocketId(socket.id),
      ]);
      if (isEmpty(user && room)) return;

      if (!room.members.includes(user._id)) return;

      socket
        .to(toSocketId)
        .emit(SOCKET_MESSAGE.INCOMMING_CALL, { from: user, offer });
    });

    socket.on(SOCKET_MESSAGE.CALL_ACCEPTED, async ({ toUser, ans }) => {
      const user = await User.findOne({ socketId: socket.id }).exec();
      if (isEmpty(user)) return;
      socket
        .to(toUser.socketId)
        .emit(SOCKET_MESSAGE.CALL_ACCEPTED, { from: user, ans });
    });

    socket.on(
      SOCKET_MESSAGE.ICE_CANDIDATE,
      async ({ candidate, toSocketId }) => {
        socket.to(toSocketId).emit(SOCKET_MESSAGE.ICE_CANDIDATE, { candidate, toSocketId: socket.id });
      }
    );

    socket.on(SOCKET_MESSAGE.UPLOAD_FILE, async (file, callback) => {
      const [sender, room] = await Promise.all([
        User.findOne({ socketId: socket.id }),
        getRoomBySocketId(socket.id),
      ]);
      if (isEmpty(sender && room)) return;

      writeFile("/upload", file, (err) => {
        console.log("🚀 ~ file err: ", err)
        callback({ message: err ? "failure" : "success" });
        if(err) return
      });

      const url = path.join(__dirname, '../', `download/${fileName}`);

      const newMessage = new Message({
        content: filePath,
        sender: sender._id,
        typeMessage: 'file'
      });
      await Promise.all([
        newMessage.save(),
        Room.updateOne(
          { code: room.code },
          { $set: { messages: [...room.messages, newMessage._id] } }
        ),
      ]);

      io.to(room.code).emit(SOCKET_MESSAGE.RECEIVE_MESSAGE, {
        sender,
        content: url,
        url,
        fileName: file.name
      })
    });
  });

  const deleteUser = async ({ roomCode, socketId }) => {
    try {
      const [room, user] = await Promise.all([
        Room.findOne({ code: roomCode }).exec(),
        User.findOne({ socketId }).exec(),
      ]);
      if (isEmpty(room)) return [false];
      const members = room.members.filter(
        (val) => val.toString() != user._id.toString()
      );

      // delete room
      if (members.length === 0) {
        await Promise.all([
          Message.deleteMany({ _id: { $in: room.messages } }),
          User.deleteMany({
            _id: { $in: [...room.disconnectUsers, user._id] },
          }),
          Room.deleteOne({ code: roomCode }),
        ]);
        return [true, user];
      }

      // update room
      if (room.host.toString() == user._id.toString()) {
        room.host = members[0];
      }
      await Room.updateOne(
        { code: roomCode },
        {
          $set: {
            members,
            host: room.host,
            disconnectUsers: [...room.disconnectUsers, user._id],
          },
        }
      ).exec();
      return [true, user];
    } catch (err) {
      return [false];
    }
  };

  const getRoomBySocketId = async (socketId) => {
    const user = await User.findOne({ socketId }).exec();
    if (isEmpty(user)) return null;
    return await Room.findOne({ members: { $all: [user._id] } });
  };
};
