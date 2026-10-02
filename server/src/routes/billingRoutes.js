const express = require('express');
const router = express.Router();
const { getBillingInfo, changePlan } = require('../controllers/billingController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getBillingInfo);
router.post('/change-plan', changePlan);

module.exports = router;
