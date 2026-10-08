const express = require('express');
const router = express.Router();
const {
  handleIncomingVoiceCall,
  handleVoiceCallEvents,
  handleVapiWebhook,
  handleCallCompletedWebhook,
} = require('../controllers/webhookController');

router.post('/voice/incoming', handleIncomingVoiceCall);
router.post('/voice/events', handleVoiceCallEvents);
router.post('/vapi', handleVapiWebhook);
router.post('/call-completed', handleCallCompletedWebhook);

module.exports = router;
