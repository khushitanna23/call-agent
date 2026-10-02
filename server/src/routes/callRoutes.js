const express = require('express');
const router = express.Router();
const {
  getCalls,
  getCallById,
  transferCall,
  simulateCall,
} = require('../controllers/callController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getCalls);
router.post('/simulate', simulateCall);
router.route('/:id').get(getCallById);
router.post('/:id/transfer', transferCall);

module.exports = router;
