const express = require('express');
const router = express.Router();
const {
  getAdminMetrics,
  getCustomers,
  toggleCustomerStatus,
  getErrorLogs,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(requireRole('admin'));

router.get('/metrics', getAdminMetrics);
router.get('/customers', getCustomers);
router.put('/customers/:id/toggle-status', toggleCustomerStatus);
router.get('/error-logs', getErrorLogs);

module.exports = router;
