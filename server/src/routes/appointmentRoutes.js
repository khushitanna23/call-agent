const express = require('express');
const router = express.Router();
const {
  getAppointments,
  createAppointment,
  updateAppointment,
  cancelAppointment,
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/').get(getAppointments).post(createAppointment);
router.route('/:id').put(updateAppointment).delete(cancelAppointment);

module.exports = router;
