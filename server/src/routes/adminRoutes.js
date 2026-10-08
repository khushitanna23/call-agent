const express = require('express');
const router = express.Router();
const {
  getAdminMetrics,
  getCustomers,
  getClientDetails,
  createClient,
  updateClient,
  toggleCustomerStatus,
  getPlatformAgents,
  getPlatformCalls,
  getPlatformLeads,
  getPlatformAppointments,
  getErrorLogs,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(requireRole('admin', 'super_admin'));

router.get('/metrics', getAdminMetrics);

// Client & Organization Management
router.get('/clients', getCustomers);
router.post('/clients', createClient);
router.get('/clients/:id', getClientDetails);
router.put('/clients/:id', updateClient);
router.put('/clients/:id/toggle-status', toggleCustomerStatus);

// Organization Aliases
router.get('/organizations', getCustomers);
router.post('/organizations', createClient);
router.get('/organizations/:id', getClientDetails);

// Backwards compatibility
router.get('/customers', getCustomers);
router.put('/customers/:id/toggle-status', toggleCustomerStatus);

// Platform-wide cross-client overviews
router.get('/agents', getPlatformAgents);
router.get('/calls', getPlatformCalls);
router.get('/leads', getPlatformLeads);
router.get('/appointments', getPlatformAppointments);

router.get('/error-logs', getErrorLogs);

module.exports = router;
