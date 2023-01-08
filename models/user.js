const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const User = new Schema(
    {
        username: {
            type: String,
            required: true,
        },
        password: String,
        avatar: String
    },
    { timestamps: true }
);
module.exports = mongoose.model("user", User);
