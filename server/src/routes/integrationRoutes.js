const express = require('express');
const router = express.Router();
const {
  getIntegrations,
  saveIntegration,
  disconnectIntegration,
} = require('../controllers/integrationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getIntegrations);
router.post('/:serviceKey', saveIntegration);
router.delete('/:serviceKey', disconnectIntegration);

module.exports = router;
