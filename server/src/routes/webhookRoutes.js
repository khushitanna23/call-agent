const express = require('express');
const router = express.Router();
const { handleIncomingVoiceCall, handleVoiceCallEvents } = require('../controllers/webhookController');

router.post('/voice/incoming', handleIncomingVoiceCall);
router.post('/voice/events', handleVoiceCallEvents);

module.exports = router;
