const express = require('express');
const router = express.Router();
const {
  getKnowledge,
  uploadDocument,
  createKnowledge,
  createWebsiteKnowledge,
  searchKnowledge,
  deleteKnowledge,
} = require('../controllers/knowledgeController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router.route('/').get(getKnowledge).post(createKnowledge);
router.get('/websites', (req, res, next) => { req.query.type = 'website'; getKnowledge(req, res, next); });
router.get('/documents', (req, res, next) => { req.query.type = 'document'; getKnowledge(req, res, next); });
router.get('/faqs', (req, res, next) => { req.query.type = 'faq'; getKnowledge(req, res, next); });
router.get('/services', (req, res, next) => { req.query.type = 'service'; getKnowledge(req, res, next); });
router.get('/pricing', (req, res, next) => { req.query.type = 'pricing'; getKnowledge(req, res, next); });
router.post('/upload', upload.single('file'), uploadDocument);
router.post('/websites', createWebsiteKnowledge);
router.post('/documents', upload.single('file'), uploadDocument);
router.post('/faqs', createKnowledge);
router.post('/services', createKnowledge);
router.post('/pricing', createKnowledge);
router.post('/custom-text', createKnowledge);
router.post('/search', searchKnowledge);
router.post('/retrieve', searchKnowledge);
router.route('/:id').delete(deleteKnowledge);

module.exports = router;
