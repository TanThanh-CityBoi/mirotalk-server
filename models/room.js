const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Room = new Schema(
    {
        name: String,
        rootId: {
            type: Schema.Types.ObjectId,
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
