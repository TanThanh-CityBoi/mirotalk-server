const express = require('express');
const router = express.Router();
const AppController = require('../controllers/AppController')
const { AuthGuard } = require('../middlewares/auth.guard')

router.post('/v1/meeting', AuthGuard, AppController.meeting);
router.post('/v1/join', AuthGuard, AppController.join);

module.exports = router;
