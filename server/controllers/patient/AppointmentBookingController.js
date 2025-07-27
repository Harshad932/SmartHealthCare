import {pool} from '../../config/db.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

// Get all approved doctors with pagination and filters
export const getDoctors = async (req, res) => {
  try {
    const { page = 1, limit = 12, specialization, search, status = 'approved' } = req.query;

    let query = `
      SELECT d.doctor_id, d.first_name, d.last_name, d.email, d.phone,
             d.specialization, d.qualification, d.experience_years,
             d.consultation_fee, d.bio, d.clinic_address,
             d.availability_status, d.created_at,
             COALESCE(AVG(dr.rating), 0) as average_rating,
             COUNT(dr.rating) as total_reviews
      FROM doctors d
      LEFT JOIN doctor_reviews dr ON d.doctor_id = dr.doctor_id
      WHERE d.approval_status = $1 AND d.is_active = true
    `;

    const queryParams = [status];

    // Add specialization filter
    if (specialization) {
      query += ` AND d.specialization = $${queryParams.length + 1}`;
      queryParams.push(specialization);
    }

    // Add search filter
    if (search) {
      query += ` AND (CONCAT(d.first_name, ' ', d.last_name) ILIKE $${queryParams.length + 1} 
                     OR d.specialization ILIKE $${queryParams.length + 1})`;
      queryParams.push(`%${search}%`);
    }

    query += ` GROUP BY d.doctor_id ORDER BY d.created_at DESC`;

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT d.doctor_id) 
      FROM doctors d 
      WHERE d.approval_status = $1 AND d.is_active = true
    `;
    const countParams = [status];

    if (specialization) {
      countQuery += ` AND d.specialization = $${countParams.length + 1}`;
      countParams.push(specialization);
    }

    if (search) {
      countQuery += ` AND (CONCAT(d.first_name, ' ', d.last_name) ILIKE $${countParams.length + 1} 
                         OR d.specialization ILIKE $${countParams.length + 1})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.status(200).json({
      message: 'Doctors retrieved successfully',
      data: {
        doctors: result.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: offset + limit < totalCount,
          hasPrevious: page > 1,
        },
      },
    });

  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching doctors',
    });
  }
};

// Get all unique specializations
export const getSpecializations = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT specialization 
      FROM doctors 
      WHERE approval_status = 'approved' AND is_active = true 
      ORDER BY specialization ASC
    `);

    const specializations = result.rows.map(row => row.specialization);

    res.status(200).json({
      message: 'Specializations retrieved successfully',
      data: {
        specializations,
      },
    });

  } catch (error) {
    console.error('Get specializations error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching specializations',
    });
  }
};

// Get doctor availability for a specific date
export const getDoctorAvailability = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        error: 'Date parameter is required',
      });
    }

    // Validate date format
    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format',
      });
    }

    // Check if the date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (appointmentDate < today) {
      return res.status(400).json({
        error: 'Cannot book appointments for past dates',
      });
    }

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = appointmentDate.getDay();

    // Get doctor's availability schedule for the day
    const availabilityResult = await pool.query(`
      SELECT start_time, end_time, break_start_time, break_end_time
      FROM doctor_availability 
      WHERE doctor_id = $1 AND day_of_week = $2 AND is_active = true
    `, [doctorId, dayOfWeek]);

    if (availabilityResult.rows.length === 0) {
      return res.status(200).json({
        message: 'No availability found for this date',
        data: {
          slots: [],
        },
      });
    }

    const availability = availabilityResult.rows[0];

    // Get existing appointments for the date
    const appointmentsResult = await pool.query(`
      SELECT appointment_time 
      FROM appointments 
      WHERE doctor_id = $1 AND appointment_date = $2 
      AND status IN ('pending', 'confirmed')
    `, [doctorId, date]);

    const bookedSlots = appointmentsResult.rows.map(row => row.appointment_time);

    // Generate time slots (30-minute intervals)
    const slots = [];
    const startTime = new Date(`2000-01-01T${availability.start_time}`);
    const endTime = new Date(`2000-01-01T${availability.end_time}`);
    const breakStart = availability.break_start_time ? new Date(`2000-01-01T${availability.break_start_time}`) : null;
    const breakEnd = availability.break_end_time ? new Date(`2000-01-01T${availability.break_end_time}`) : null;

    const currentSlot = new Date(startTime);
    
    while (currentSlot < endTime) {
      const slotTime = currentSlot.toTimeString().slice(0, 5); // HH:MM format
      
      // Check if slot is during break time
      const isDuringBreak = breakStart && breakEnd && 
        currentSlot >= breakStart && currentSlot < breakEnd;
      
      // Check if slot is already booked
      const isBooked = bookedSlots.some(bookedTime => 
        bookedTime === slotTime
      );

      // Check if slot is in the past (for today's appointments)
      const now = new Date();
      const slotDateTime = new Date(appointmentDate);
      slotDateTime.setHours(currentSlot.getHours(), currentSlot.getMinutes(), 0, 0);
      const isPast = appointmentDate.toDateString() === now.toDateString() && slotDateTime <= now;

      if (!isDuringBreak && !isPast) {
        slots.push({
          time: slotTime,
          isBooked: isBooked,
          isAvailable: !isBooked
        });
      }

      // Move to next 30-minute slot
      currentSlot.setMinutes(currentSlot.getMinutes() + 30);
    }

    res.status(200).json({
      message: 'Doctor availability retrieved successfully',
      data: {
        slots,
        doctorSchedule: {
          startTime: availability.start_time,
          endTime: availability.end_time,
          breakStartTime: availability.break_start_time,
          breakEndTime: availability.break_end_time,
        },
      },
    });

  } catch (error) {
    console.error('Get doctor availability error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching doctor availability',
    });
  }
};

// Book an appointment
export const bookAppointment = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const patientId = req.user.userId;
    const {
      doctorId,
      appointmentDate,
      appointmentTime,
      reasonForVisit,
      additionalNotes,
      preferredLanguage = 'English',
      isUrgent = false
    } = req.body;

    // Validate required fields
    if (!doctorId || !appointmentDate || !appointmentTime || !reasonForVisit) {
      return res.status(400).json({
        error: 'Missing required fields: doctorId, appointmentDate, appointmentTime, reasonForVisit',
      });
    }

    // Validate date is not in the past
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    if (appointmentDateTime <= new Date()) {
      return res.status(400).json({
        error: 'Cannot book appointments for past dates/times',
      });
    }

    // Check if doctor exists and is approved
    const doctorResult = await client.query(`
      SELECT doctor_id, first_name, last_name, availability_status 
      FROM doctors 
      WHERE doctor_id = $1 AND approval_status = 'approved' AND is_active = true
    `, [doctorId]);

    if (doctorResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Doctor not found or not available for bookings',
      });
    }

    const doctor = doctorResult.rows[0];

    // Check if the time slot is available
    const existingAppointmentResult = await client.query(`
      SELECT appointment_id 
      FROM appointments 
      WHERE doctor_id = $1 AND appointment_date = $2 AND appointment_time = $3 
      AND status IN ('pending', 'confirmed')
    `, [doctorId, appointmentDate, appointmentTime]);

    if (existingAppointmentResult.rows.length > 0) {
      return res.status(409).json({
        error: 'This time slot is already booked',
      });
    }

    // Check if doctor is available on this day and time
    const dayOfWeek = new Date(appointmentDate).getDay();
    const availabilityResult = await client.query(`
      SELECT start_time, end_time, break_start_time, break_end_time
      FROM doctor_availability 
      WHERE doctor_id = $1 AND day_of_week = $2 AND is_active = true
    `, [doctorId, dayOfWeek]);

    if (availabilityResult.rows.length === 0) {
      return res.status(400).json({
        error: 'Doctor is not available on this day',
      });
    }

    const availability = availabilityResult.rows[0];
    const requestedTime = appointmentTime;

    // Check if requested time is within doctor's working hours
    if (requestedTime < availability.start_time || requestedTime >= availability.end_time) {
      return res.status(400).json({
        error: 'Requested time is outside doctor\'s working hours',
      });
    }

    // Check if requested time is during break
    if (availability.break_start_time && availability.break_end_time) {
      if (requestedTime >= availability.break_start_time && requestedTime < availability.break_end_time) {
        return res.status(400).json({
          error: 'Requested time is during doctor\'s break hours',
        });
      }
    }

    // Create the appointment
    const appointmentResult = await client.query(`
      INSERT INTO appointments (
        patient_id, doctor_id, appointment_date, appointment_time,
        reason_for_visit, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING appointment_id
    `, [patientId, doctorId, appointmentDate, appointmentTime, reasonForVisit]);

    const appointmentId = appointmentResult.rows[0].appointment_id;

    // Create appointment request record
    await client.query(`
      INSERT INTO appointment_requests (appointment_id, request_timestamp)
      VALUES ($1, CURRENT_TIMESTAMP)
    `, [appointmentId]);

    // Create notification for doctor
    await client.query(`
      INSERT INTO doctor_notifications (doctor_id, type, title, message, created_at)
      VALUES ($1, 'appointment_request', 'New Appointment Request', 
              $2, CURRENT_TIMESTAMP)
    `, [
      doctorId,
      `You have a new appointment request for ${new Date(appointmentDate).toLocaleDateString()} at ${appointmentTime}. Reason: ${reasonForVisit}`
    ]);

    // Create notification for patient
    await client.query(`
      INSERT INTO patient_notifications (patient_id, type, title, message, created_at)
      VALUES ($1, 'appointment_booked', 'Appointment Request Sent', 
              $2, CURRENT_TIMESTAMP)
    `, [
      patientId,
      `Your appointment request with Dr. ${doctor.first_name} ${doctor.last_name} for ${new Date(appointmentDate).toLocaleDateString()} at ${appointmentTime} has been sent for confirmation.`
    ]);

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Appointment booked successfully',
      data: {
        appointmentId,
        status: 'pending',
        appointmentDate,
        appointmentTime,
        doctorName: `Dr. ${doctor.first_name} ${doctor.last_name}`,
        message: 'Your appointment request has been sent to the doctor for confirmation.',
      },
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Book appointment error:', error);
    res.status(500).json({
      error: 'Internal server error while booking appointment',
    });
  } finally {
    client.release();
  }
};

// Get appointment details by ID
export const getAppointmentDetails = async (req, res) => {
  try {
    const patientId = req.user.userId;
    const { appointmentId } = req.params;

    const result = await pool.query(`
      SELECT a.appointment_id, a.appointment_date, a.appointment_time, a.duration,
             a.status, a.reason_for_visit, a.consultation_notes, a.created_at,
             CONCAT(d.first_name, ' ', d.last_name) as doctor_name,
             d.specialization, d.consultation_fee, d.clinic_address, d.phone as doctor_phone,
             CONCAT(p.first_name, ' ', p.last_name) as patient_name,
             p.phone as patient_phone, p.email as patient_email
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.doctor_id
      JOIN patients p ON a.patient_id = p.patient_id
      WHERE a.appointment_id = $1 AND a.patient_id = $2
    `, [appointmentId, patientId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Appointment not found',
      });
    }

    res.status(200).json({
      message: 'Appointment details retrieved successfully',
      data: {
        appointment: result.rows[0],
      },
    });

  } catch (error) {
    console.error('Get appointment details error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching appointment details',
    });
  }
};

// Cancel appointment
export const cancelAppointment = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const patientId = req.user.userId;
    const { appointmentId } = req.params;
    const { cancellationReason } = req.body;

    // Check if appointment exists and belongs to the patient
    const appointmentResult = await client.query(`
      SELECT a.appointment_id, a.status, a.appointment_date, a.appointment_time, a.doctor_id,
             CONCAT(d.first_name, ' ', d.last_name) as doctor_name
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.doctor_id
      WHERE a.appointment_id = $1 AND a.patient_id = $2
    `, [appointmentId, patientId]);

    if (appointmentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Appointment not found',
      });
    }

    const appointment = appointmentResult.rows[0];

    // Check if appointment can be cancelled
    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        error: 'Appointment is already cancelled',
      });
    }

    if (appointment.status === 'completed') {
      return res.status(400).json({
        error: 'Cannot cancel completed appointment',
      });
    }

    // Update appointment status
    await client.query(`
      UPDATE appointments 
      SET status = 'cancelled', cancellation_reason = $1, updated_at = CURRENT_TIMESTAMP
      WHERE appointment_id = $2
    `, [cancellationReason, appointmentId]);

    // Create notification for doctor
    await client.query(`
      INSERT INTO doctor_notifications (doctor_id, type, title, message, created_at)
      VALUES ($1, 'appointment_cancelled', 'Appointment Cancelled', 
              $2, CURRENT_TIMESTAMP)
    `, [
      appointment.doctor_id,
      `Patient has cancelled the appointment scheduled for ${new Date(appointment.appointment_date).toLocaleDateString()} at ${appointment.appointment_time}. ${cancellationReason ? `Reason: ${cancellationReason}` : ''}`
    ]);

    // Create notification for patient
    await client.query(`
      INSERT INTO patient_notifications (patient_id, type, title, message, created_at)
      VALUES ($1, 'appointment_cancelled', 'Appointment Cancelled', 
              $2, CURRENT_TIMESTAMP)
    `, [
      patientId,
      `Your appointment with ${appointment.doctor_name} scheduled for ${new Date(appointment.appointment_date).toLocaleDateString()} at ${appointment.appointment_time} has been cancelled.`
    ]);

    await client.query('COMMIT');

    res.status(200).json({
      message: 'Appointment cancelled successfully',
      data: {
        appointmentId,
        status: 'cancelled',
        cancellationReason,
      },
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      error: 'Internal server error while cancelling appointment',
    });
  } finally {
    client.release();
  }
};