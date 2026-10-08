const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getCampaigns,
  createCampaign,
  toggleCampaignStatus,
  deleteCampaign,
} = require('../controllers/campaignController');

router.use(protect);

router.route('/')
  .get(getCampaigns)
  .post(createCampaign);

router.route('/:id/toggle')
  .put(toggleCampaignStatus);

router.route('/:id')
  .delete(deleteCampaign);

module.exports = router;
