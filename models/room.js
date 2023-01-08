const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Room = new Schema(
    {
        name: String,
        code: {
            type: String,
            unique: true
        },
        host: {
            type: Schema.Types.ObjectId,
            ref: 'user',
            required: true
        },
        members: [{
            type: Schema.Types.ObjectId,
            ref: "user"
        }],
        messages: [{
            type: Schema.Types.ObjectId,
            ref: "message"
        }]
    },
    { timestamps: true }
);

module.exports = mongoose.model("room", Room);
