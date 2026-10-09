const express = require('express');
const router = express.Router();
const {
  getPhoneNumbers,
  purchasePhoneNumber,
  updatePhoneNumber,
} = require('../controllers/phoneNumberController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getPhoneNumbers);
router.post('/purchase', purchasePhoneNumber);
router.route('/:id').put(updatePhoneNumber);

module.exports = router;
