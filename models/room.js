const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Room = new Schema(
    {
        name: String,
        code: String,
        host: {
            type: Schema.Types.ObjectId,
            ref: 'user',
            required: true
        },
        members: [{
            type: Schema.Types.ObjectId,
            ref: "user"
        }],
    },
    { timestamps: true }
);

module.exports = mongoose.model("room", Room);
