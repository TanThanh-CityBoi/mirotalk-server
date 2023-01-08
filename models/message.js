const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Message = new Schema(
    {
        roomId: Schema.Types.ObjectId,
        sender: {
            username: String,
            avatar: String,
        },
        content: String,
        type: String,
    },
    { timestamps: true }
);

module.exports = mongoose.model("message", Message);
