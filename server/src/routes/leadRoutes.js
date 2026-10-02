const express = require('express');
const router = express.Router();
const {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  addLeadActivity,
  deleteLead,
} = require('../controllers/leadController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getLeads).post(createLead);
router.route('/:id').get(getLeadById).put(updateLead).delete(deleteLead);
router.post('/:id/activity', addLeadActivity);

module.exports = router;
