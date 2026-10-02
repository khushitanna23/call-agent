const express = require('express');
const router = express.Router();
const { bookDemo, voiceTurn } = require('../controllers/demoController');

router.post('/book', bookDemo);
router.post('/voice-turn', voiceTurn);

module.exports = router;
