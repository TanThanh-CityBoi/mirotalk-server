const express = require('express');
const Room = require('../models/room');
const User = require('../models/user')
const { isEmpty } = require('lodash')
const router = express.Router();

router.post('/join-room', async (req, res) => {
    const { roomCode, username, socketId } = req.body
    try {
        const newUser = new User({
            username,
            socketId
        })
        var [_, existedRoom] = await Promise.all([
            newUser.save(),
            Room.findOne({ code: roomCode })
        ])
        if (isEmpty(existedRoom)) {
            existedRoom = new Room({
                code: roomCode,
                host: newUser._id
            })
            await existedRoom.save()
        }

        existedRoom.members.push(newUser._id)
        await Room.updateOne(
            { code: roomCode },
            { $set: { members: existedRoom.members } }
        ).exec()

        const result = await Room.findOne({ code: roomCode })
            .populate('members')
            .populate('host')
            .populate('messages')
            .exec()

        return res.status(200).send(JSON.stringify({
            room: result,
            message: "SUCCESS"
        }))
    }
    catch (err) {
        console.error(err)
        return res.status(500).send(JSON.stringify({
            message: 'BAD_REQUEST',
            Error: err
        }))
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
    Room.findOne({ code: roomCode })
        .populate('members')
        .populate('host')
        .populate('messages')
        .exec()
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
