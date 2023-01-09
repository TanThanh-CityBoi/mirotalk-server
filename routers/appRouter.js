const express = require('express');
const Room = require('../models/room');
const User = require('../models/user')
const router = express.Router();

router.post('/create-room', (req, res) => {
    const { hostId, roomId } = req.body
    const newRoom = new Room({
        code: roomId,
        host: hostId
    })
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

router.post('/create-user', (req, res) => {
    const { userName } = req.body;
    const newUser = new User({ userName })
    newUser.save()
        .then(data => {
            res.status(201) / send(JSON.stringify({
                data,
                message: "CREATED"
            }))
        })
        .catch(err => {
            console.error(err)
            res.status(400).send(err)
        })
})

module.exports = router;
