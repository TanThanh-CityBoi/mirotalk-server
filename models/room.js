const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Room = new Schema(
    {
        name: String,
        code: {
            type: String,
            require: true,
            unique: true
        },
        host: {
            type: Schema.Types.ObjectId,
            ref: 'user',
        },
        members: [{
            type: Schema.Types.ObjectId,
            ref: "user"
        }],
        messages: [{
            type: Schema.Types.ObjectId,
            ref: "message"
        }],
        disconnectUsers: [{
            type: Schema.Types.ObjectId,
            ref: 'user'
        }],
    },
    { timestamps: true }
);

module.exports = mongoose.model("room", Room);
