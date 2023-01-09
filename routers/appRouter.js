const express = require('express');
const Room = require('../models/room');
const User = require('../models/user')
const { isEmpty } = require('lodash')
const router = express.Router();

router.post('/create-room', (req, res) => {
    const { roomCode } = req.body
    const newRoom = new Room({ code: roomCode })
    newRoom.save()
        .then((data) => {
            res.status(201).send(JSON.stringify({
                data,
                message: 'CREATED'
            }))
        })
        .catch((err) => {
            console.error(err)
            res.status(400).send(err)
        })
});

router.post('/create-user', async (req, res) => {
    const { username, roomCode } = req.body;
    const newUser = new User({ username })
    try {
        await newUser.save();
        const room = await Room.findOne({ code: roomCode })
        if (isEmpty(room)) {
            res.status(404).send(JSON.stringify({ message: "ROOM_NOT_FOUND" }))
        }
        room.members.push(newUser._id)
        await Room.updateOne(
            { code: roomCode },
            { $set: { members: room.members, host: room.host ? room.host : newUser._id } }
        ).exec()
        res.status(201).send(JSON.stringify({
            user: newUser,
            message: 'CREATED'
        }))
    }
    catch (err) {
        console.error(err)
        res.status(400).send(err)
    }
})

router.get('/rooms', async (req, res) => {
    const rooms = await Room.find()

    res.status(200).send(JSON.stringify({
        rooms
    }))
})

module.exports = router;
