const express = require('express');
const router = express.Router();

router.post('/join-room', (req, res) => {
    res.status(200).send(JSON.stringify({
        status: 200,
        data: null,
        message: 'OK',
        error: null
    }))
});

module.exports = router;
