/**
 * Automated Outbound AI Call Scheduler
 * Periodically monitors appointments, detects when scheduled time arrives,
 * automatically initiates outbound AI phone calls, conducts the conversational
 * consultation session, records transcripts & summaries, and synchronizes
 * leads and appointments into the CRM dashboard.
 */

const Appointment = require('../models/Appointment');
const Agent = require('../models/Agent');
const Call = require('../models/Call');
const CallTranscript = require('../models/CallTranscript');
const CallRecording = require('../models/CallRecording');
const CallSummary = require('../models/CallSummary');
const Lead = require('../models/Lead');
const Organization = require('../models/Organization');

class CallSchedulerService {
  constructor() {
    this.intervalId = null;
    this.isProcessing = false;
    this.pollIntervalMs = 25000; // Check every 25 seconds
  }

  /**
   * Start the background scheduler
   */
  startScheduler() {
    if (this.intervalId) return;

    console.log(`[CallScheduler] 🕒 Background Appointment Call Scheduler started (Polling every ${this.pollIntervalMs / 1000}s)`);

    // Initial check after 5 seconds
    setTimeout(() => {
      this.checkAndTriggerScheduledCalls();
    }, 5000);

    this.intervalId = setInterval(() => {
      this.checkAndTriggerScheduledCalls();
    }, this.pollIntervalMs);
  }

  /**
   * Stop the background scheduler
   */
  stopScheduler() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[CallScheduler] Scheduler stopped');
    }
  }

  /**
   * Main polling routine
   */
  async checkAndTriggerScheduledCalls() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const now = new Date();

      // Find scheduled appointments where call has not yet been triggered
      const scheduledAppts = await Appointment.find({
        status: 'scheduled',
        autoCallTriggered: { $ne: true },
      })
        .populate('agentId')
        .populate('organizationId')
        .limit(20);

      for (const appt of scheduledAppts) {
        let isDue = false;
        if (appt.scheduledDateTime && appt.scheduledDateTime <= now) {
          isDue = true;
        } else if (appt.date && appt.timeSlot) {
          try {
            let [timePart, meridiem] = (appt.timeSlot || '').trim().split(' ');
            let [hours, minutes] = (timePart || '').split(':').map(Number);
            if (meridiem && meridiem.toUpperCase() === 'PM' && hours < 12) hours += 12;
            if (meridiem && meridiem.toUpperCase() === 'AM' && hours === 12) hours = 0;
            const dt = new Date(`${appt.date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
            if (dt <= now) isDue = true;
          } catch {
            if (appt.date < now.toISOString().split('T')[0]) isDue = true;
          }
        }

        if (isDue) {
          // DUPLICATE CALL PREVENTION: Atomically lock appointment
          const lockedAppt = await Appointment.findOneAndUpdate(
            {
              _id: appt._id,
              status: 'scheduled',
              autoCallTriggered: { $ne: true },
            },
            {
              $set: {
                status: 'calling',
                autoCallStatus: 'calling',
                autoCallTriggered: true,
                callStartedAt: new Date(),
              },
            },
            { new: true }
          )
            .populate('agentId')
            .populate('organizationId');

          if (!lockedAppt) {
            // Already locked by another cycle
            continue;
          }

          console.log(`[Scheduler] Appointment found: ${lockedAppt.bookingReference} for ${lockedAppt.customerName}`);
          console.log(`[Scheduler] Starting outbound call to ${lockedAppt.customerPhone}`);

          try {
            await this.executeCallForAppointment(lockedAppt);
          } catch (callErr) {
            console.error(`[Scheduler Error] Call failed for ${lockedAppt.bookingReference}:`, callErr.message);
          }
        }
      }
    } catch (err) {
      console.error('[CallScheduler] Error in polling loop:', err.message);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute automated outbound AI call for a specific appointment
   * Can be invoked by the scheduler at scheduled time OR immediately via "Test Instant AI Call Now"
   */
  async executeCallForAppointment(appointmentOrId, isInstantTest = false) {
    let appointment = appointmentOrId;
    if (typeof appointmentOrId === 'string' || appointmentOrId instanceof String) {
      appointment = await Appointment.findById(appointmentOrId)
        .populate('agentId')
        .populate('organizationId');
    }

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    if (isInstantTest && appointment.status !== 'calling') {
      appointment.status = 'calling';
      appointment.autoCallStatus = 'calling';
      appointment.autoCallTriggered = true;
      appointment.callStartedAt = new Date();
      await appointment.save();
      console.log(`[Scheduler] Manual test call initiated for appointment ${appointment.bookingReference}`);
    }

    // Fetch or fallback agent
    let agent = appointment.agentId;
    if (!agent || !agent._id) {
      agent = await Agent.findOne({ organizationId: appointment.organizationId, status: 'ONLINE' });
      if (!agent) agent = await Agent.findOne({ organizationId: appointment.organizationId });
    }

    const voiceService = require('./voiceService');

    try {
      const vapiResult = await voiceService.startOutboundCall({
        appointment,
        agent,
      });

      console.log(`[Vapi] Outbound call initiated`);
      console.log(`[Vapi] Call ID: ${vapiResult.callId}`);

      appointment.vapiCallId = vapiResult.callId;
      appointment.callStatus = 'calling';
      await appointment.save();

      return {
        success: true,
        message: `Vapi outbound call successfully placed to ${appointment.customerPhone}`,
        callId: vapiResult.callId,
      };
    } catch (err) {
      console.error(`[Vapi Error] Outbound call failed to initiate:`, err.message);
      appointment.status = 'failed';
      appointment.autoCallStatus = 'failed';
      appointment.callStatus = 'failed';
      appointment.callEndedReason = err.message;
      await appointment.save();
      throw err;
    }
  }
}

module.exports = new CallSchedulerService();
