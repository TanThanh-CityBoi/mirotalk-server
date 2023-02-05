const express = require('express');
const Room = require('../models/room');
const User = require('../models/user')
const { isEmpty } = require('lodash')
const router = express.Router();
const path = require('path');
const fs = require('fs')

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
            .populate({
                path: "messages",
                populate: { path: "sender", model: "user" },
            })
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
        .populate({
            path: "messages",
            populate: { path: "sender", model: "user" },
        })
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

router.get('/download/:id', (req, res) => {
    const { id } = req.params
    var filePath = path.join(__dirname, '../', `upload/${id}`);
    res.download(filePath)
})

router.post('/upload', (req, res) => {

    const files = req.files;
    if (isEmpty(files)) {
        return res.status(400).send('FILE_NOT_FOUND')
    }

    try {
        const { name, data } = Object.values(files)[0]
        var filePath = path.join(__dirname, "../", "/upload/" + name);

        fs.writeFile(filePath, data, function (err) {
            if (err) throw err
        });

        res.status(200).send(JSON.stringify({
            message: "UPLOADED",
            data: {
                fileName: name,
                url: `${req.headers.host}/download/${name}`
            }
        }))
    }
    catch (err) {
        return res.status(500).send(JSON.stringify({
            message: 'INTERNAL_SERVER_ERROR',
            Error: err
        }))
    }

})

module.exports = router;
