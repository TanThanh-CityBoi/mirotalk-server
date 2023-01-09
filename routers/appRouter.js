const express = require('express');
const Room = require('../models/room');
const User = require('../models/user')
const { isEmpty } = require('lodash')
const router = express.Router();

router.post('/create-room', (req, res) => {
    const { roomCode } = req.body
    const existedRoom = Room.findOne({ code: roomCode })
    if (!isEmpty(existedRoom)) {
        return res.status(400).send(JSON.stringify({
            message: "ROOM_EXISTED"
        }))
    }
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
            return res.status(404).send(JSON.stringify({ message: "ROOM_NOT_FOUND" }))
        }
        room.members.push(newUser._id)
        await Room.updateOne(
            { code: roomCode },
            { $set: { members: room.members, host: room.host ? room.host : newUser._id } }
        ).exec()
        return res.status(201).send(JSON.stringify({
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
    Room.find().exec()
        .then(data => {
            return res.status(200).send(JSON.stringify({
                rooms: data,
                total: data?.length,
                message: 'SUCCESS'
            }))
        })
        .catch(err => {
            return res.status(500).send(JSON.stringify({
                message: 'INTERNAL_SERVER_ERROR',
                Error: err
            }))
        })
})

router.get('/room/:roomCode', async (req, res) => {
    const { roomCode } = req.params

    Room.findOne({ code: roomCode }).exec()
        .then(data => {
            const message = isEmpty(data) ? 'ROOM_NOT_FOUND' : 'SUCCESS'
            return res.status(200).send(JSON.stringify({
                room: data,
                message
            }))
        })
        .catch(err => {
            return res.status(500).send(JSON.stringify({
                message: 'INTERNAL_SERVER_ERROR',
                Error: err
            }))
        })
})

module.exports = router;
