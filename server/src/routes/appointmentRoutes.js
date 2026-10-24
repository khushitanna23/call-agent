const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const {
  // Public handlers
  getPublicAgents,
  getAvailableSlots,
  getMonthAvailability,
  bookPublicAppointment,
  bookAppointmentWithGemini,
  lookupAppointment,
  reschedulePublicAppointment,
  cancelPublicAppointment,
  triggerInstantCall,
  downloadIcs,

  // Protected handlers
  getAppointments,
  createAppointment,
  updateAppointment,
  cancelAppointment,
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');

// ==========================================
// PUBLIC CUSTOMER ROUTES (NO AUTH REQUIRED)
// ==========================================
router.get('/public/agents', getPublicAgents);
router.get('/public/available-slots', getAvailableSlots);
router.get('/public/month-availability', getMonthAvailability);
router.post('/public/book', bookPublicAppointment);

// Gemini Natural Language AI Booking Route
router.post('/ai-book', bookAppointmentWithGemini);

router.get('/public/lookup/:reference', lookupAppointment);
router.post('/public/reschedule/:reference', reschedulePublicAppointment);
router.post('/public/cancel/:reference', cancelPublicAppointment);
router.post('/public/trigger-call/:reference', triggerInstantCall);
router.get('/public/download-ics/:reference', downloadIcs);

// Also allow convenient trigger endpoint by ID for internal use
router.post('/:id/trigger-call', triggerInstantCall);

// ==========================================
// PROTECTED DASHBOARD ROUTES (AUTH REQUIRED)
// ==========================================
//router.use(protect);
// router.use(protect);

router.route('/').get(getAppointments).post(createAppointment);
router.route('/:id').put(updateAppointment).delete(cancelAppointment);

router.route('/').get(getAppointments).post(createAppointment);
router.route('/:id').put(updateAppointment).delete(cancelAppointment);

module.exports = router;