/**
 * Real-world Booking Slot Engine
 * Handles dynamic business hours, past date/time validation,
 * already booked slot detection, fully booked date tracking,
 * and double booking conflict checks.
 */

const Appointment = require('../models/Appointment');
const Agent = require('../models/Agent');
const Organization = require('../models/Organization');

class BookingSlotService {
  constructor() {
    // Default business hours configuration
    this.defaultStartHour = 9; // 09:00 AM
    this.defaultEndHour = 18; // 06:00 PM (18:00)
    this.slotIntervalMinutes = 30; // 30-minute intervals
  }

  /**
   * Standard 30-minute time slots generator between start and end hours
   */
  generateDailyTimeSlots(startHour = 9, endHour = 18, intervalMinutes = 30) {
    const slots = [];
    let currentTotalMinutes = startHour * 60;
    const endTotalMinutes = endHour * 60;

    while (currentTotalMinutes < endTotalMinutes) {
      const hours24 = Math.floor(currentTotalMinutes / 60);
      const mins = currentTotalMinutes % 60;

      const meridiem = hours24 >= 12 ? 'PM' : 'AM';
      let hours12 = hours24 % 12;
      if (hours12 === 0) hours12 = 12;

      const formattedLabel = `${String(hours12).padStart(2, '0')}:${String(mins).padStart(2, '0')} ${meridiem}`;
      const time24 = `${String(hours24).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

      let period = 'morning';
      if (hours24 >= 12 && hours24 < 16) period = 'afternoon';
      else if (hours24 >= 16) period = 'evening';

      slots.push({
        timeSlot: formattedLabel,
        time24,
        period,
        durationMinutes: intervalMinutes,
      });

      currentTotalMinutes += intervalMinutes;
    }

    return slots;
  }

  /**
   * Helper to parse a date string (YYYY-MM-DD) and timeSlot ("10:30 AM") into a Date object
   */
  parseSlotDateTime(dateStr, timeSlot, timezone = 'America/New_York') {
    let [timePart, meridiem] = timeSlot.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    if (meridiem && meridiem.toUpperCase() === 'PM' && hours < 12) hours += 12;
    if (meridiem && meridiem.toUpperCase() === 'AM' && hours === 12) hours = 0;

    return new Date(`${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
  }

  /**
   * Get available slots for a given agent on a specific date
   */
  async getAvailableSlots({ agentId, date, timezone = 'America/New_York', organizationId }) {
    if (!date) {
      throw new Error('Date is required (YYYY-MM-DD)');
    }

    // Verify date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD');
    }

    const requestedDate = new Date(`${date}T00:00:00`);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Check if the requested date is in the past
    const isPastDate = date < todayStr;
    const isToday = date === todayStr;

    // Check day of week (Sunday = 0, Saturday = 6)
    const dayOfWeek = requestedDate.getDay();
    // Sunday closed by default for business appointments
    const isClosedDay = dayOfWeek === 0;

    // Fetch existing booked appointments for this agent (or organization) on this date
    const appointmentQuery = {
      date,
      status: { $in: ['scheduled', 'in_progress'] },
    };
    if (agentId) {
      appointmentQuery.agentId = agentId;
    } else if (organizationId) {
      appointmentQuery.organizationId = organizationId;
    }

    const bookedAppointments = await Appointment.find(appointmentQuery).select(
      'timeSlot customerName status bookingReference'
    );

    const bookedSlotSet = new Set(bookedAppointments.map((a) => a.timeSlot.toUpperCase()));

    // Generate full daily master slots
    const masterSlots = this.generateDailyTimeSlots(this.defaultStartHour, this.defaultEndHour, this.slotIntervalMinutes);

    // Compute availability for each slot
    const slots = masterSlots.map((slot) => {
      let isAvailable = true;
      let reason = null;

      if (isPastDate) {
        isAvailable = false;
        reason = 'Past Date';
      } else if (isClosedDay) {
        isAvailable = false;
        reason = 'Office Closed (Sunday)';
      } else if (bookedSlotSet.has(slot.timeSlot.toUpperCase())) {
        isAvailable = false;
        reason = 'Already Booked';
      } else if (isToday) {
        // If today, check if this time slot is in the past (with a 20-minute booking buffer)
        const [hours24, mins] = slot.time24.split(':').map(Number);
        const slotDate = new Date();
        slotDate.setHours(hours24, mins, 0, 0);

        const bufferMs = 20 * 60 * 1000;
        if (slotDate.getTime() <= Date.now() + bufferMs) {
          isAvailable = false;
          reason = 'Time Slot Passed';
        }
      }

      return {
        ...slot,
        isAvailable,
        reason,
      };
    });

    const totalSlots = slots.length;
    const availableCount = slots.filter((s) => s.isAvailable).length;
    const isFullyBooked = totalSlots > 0 && availableCount === 0;

    return {
      date,
      agentId,
      timezone,
      isPastDate,
      isClosedDay,
      isToday,
      totalSlots,
      availableCount,
      isFullyBooked,
      slots,
    };
  }

  /**
   * Get availability summary for an entire month
   * Used by the calendar date picker to disable fully booked / past dates
   */
  async getMonthAvailability({ agentId, year, month, timezone = 'America/New_York', organizationId }) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const currentYear = year || today.getFullYear();
    const currentMonth = month !== undefined ? month : today.getMonth() + 1; // 1-12

    // Get number of days in month
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    // Query all bookings in this month for the agent
    const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    const appointmentQuery = {
      date: { $regex: `^${monthPrefix}` },
      status: { $in: ['scheduled', 'in_progress'] },
    };
    if (agentId) {
      appointmentQuery.agentId = agentId;
    } else if (organizationId) {
      appointmentQuery.organizationId = organizationId;
    }

    const monthBookings = await Appointment.find(appointmentQuery).select('date timeSlot');

    const bookingsByDate = {};
    monthBookings.forEach((b) => {
      bookingsByDate[b.date] = (bookingsByDate[b.date] || 0) + 1;
    });

    const masterSlots = this.generateDailyTimeSlots(this.defaultStartHour, this.defaultEndHour, this.slotIntervalMinutes);
    const maxDailySlots = masterSlots.length;

    const daysSummary = {};
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${monthPrefix}-${String(day).padStart(2, '0')}`;
      const dayDate = new Date(`${dateStr}T00:00:00`);
      const isSunday = dayDate.getDay() === 0;
      const isPast = dateStr < todayStr;
      const bookedCount = bookingsByDate[dateStr] || 0;
      const isFullyBooked = !isPast && !isSunday && bookedCount >= maxDailySlots;

      daysSummary[dateStr] = {
        date: dateStr,
        day,
        isPast,
        isSunday,
        bookedCount,
        availableSlots: isPast || isSunday ? 0 : Math.max(0, maxDailySlots - bookedCount),
        isFullyBooked,
        isSelectable: !isPast && !isSunday && !isFullyBooked,
      };
    }

    return {
      year: currentYear,
      month: currentMonth,
      daysInMonth,
      days: daysSummary,
    };
  }

  /**
   * Double booking conflict checker
   * Ensures that no concurrent requests can book the same slot
   */
  async checkSlotConflict({ agentId, date, timeSlot, excludeAppointmentId = null }) {
    const query = {
      agentId,
      date,
      timeSlot,
      status: { $in: ['scheduled', 'in_progress'] },
    };

    if (excludeAppointmentId) {
      query._id = { $ne: excludeAppointmentId };
    }

    const existing = await Appointment.findOne(query);
    return !!existing;
  }
}

module.exports = new BookingSlotService();
