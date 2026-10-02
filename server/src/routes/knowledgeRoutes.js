const express = require('express');
const router = express.Router();
const {
  getKnowledge,
  uploadDocument,
  createKnowledge,
  searchKnowledge,
  deleteKnowledge,
} = require('../controllers/knowledgeController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router.route('/').get(getKnowledge).post(createKnowledge);
router.post('/upload', upload.single('file'), uploadDocument);
router.post('/search', searchKnowledge);
router.route('/:id').delete(deleteKnowledge);

module.exports = router;
