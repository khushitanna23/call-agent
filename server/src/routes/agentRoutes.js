const express = require('express');
const router = express.Router();
const {
  getAgents,
  getAgentById,
  createAgent,
  updateAgent,
  deleteAgent,
  testAgent,
  scrapeWebsite,
} = require('../controllers/agentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getAgents).post(createAgent);
router.post('/scrape-website', scrapeWebsite);
router.route('/:id').get(getAgentById).put(updateAgent).delete(deleteAgent);
router.post('/:id/test', testAgent);

module.exports = router;
