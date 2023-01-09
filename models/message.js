const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Message = new Schema(
    {
        sender: { type: Schema.Types.ObjectId, ref: 'user' },
        content: String,
        typeMessage: { type: String, default: 'text' },
    },
    { timestamps: true }
);

module.exports = mongoose.model("message", Message);
