import { pool } from '../../config/db.js';

// Get doctor profile
export const getDoctorProfile = async (req, res) => {
  try {
    const doctorId = req.user.userId;

    const result = await pool.query(
      `SELECT 
        first_name, last_name, email, phone, license_number,
        specialization, qualification, experience_years, consultation_fee,
        bio, clinic_address, availability_status, created_at
       FROM doctors 
       WHERE doctor_id = $1 AND approval_status = 'approved'`,
      [doctorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor not found or not approved' });
    }

    const doctor = result.rows[0];
    res.json({
      first_name: doctor.first_name,
      last_name: doctor.last_name,
      email: doctor.email,
      phone: doctor.phone,
      license_number: doctor.license_number,
      specialization: doctor.specialization,
      qualification: doctor.qualification,
      experience_years: doctor.experience_years,
      consultation_fee: doctor.consultation_fee,
      bio: doctor.bio,
      clinic_address: doctor.clinic_address,
      availability_status: doctor.availability_status,
      profile_image: null, // Implement with Cloudinary if needed
      created_at: doctor.created_at
    });

  } catch (error) {
    console.error('Get doctor profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update doctor profile
export const updateDoctorProfile = async (req, res) => {
  try {
    const doctorId = req.user.userId;
    const {
      firstName,
      lastName,
      phone,
      specialization,
      qualification,
      experienceYears,
      consultationFee,
      bio,
      clinicAddress
    } = req.body;

    const result = await pool.query(
      `UPDATE doctors SET 
        first_name = $1, last_name = $2, phone = $3, specialization = $4,
        qualification = $5, experience_years = $6, consultation_fee = $7,
        bio = $8, clinic_address = $9, updated_at = CURRENT_TIMESTAMP
       WHERE doctor_id = $10 AND approval_status = 'approved'
       RETURNING first_name, last_name`,
      [
        firstName?.trim(),
        lastName?.trim(),
        phone?.trim(),
        specialization?.trim(),
        qualification?.trim(),
        experienceYears ? parseInt(experienceYears) : null,
        consultationFee ? parseFloat(consultationFee) : null,
        bio?.trim(),
        clinicAddress?.trim(),
        doctorId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor not found or not approved' });
    }

    res.json({ message: 'Profile updated successfully' });

  } catch (error) {
    console.error('Update doctor profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const doctorId = req.user.userId;
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Get pending appointments
    const pendingResult = await pool.query(
      'SELECT COUNT(*) as count FROM appointments WHERE doctor_id = $1 AND status = $2',
      [doctorId, 'pending']
    );

    // Get today's appointments
    const todayResult = await pool.query(
      `SELECT COUNT(*) as count FROM appointments 
       WHERE doctor_id = $1 AND appointment_date = $2 
       AND status IN ('confirmed', 'completed')`,
      [doctorId, today]
    );

    // Get total unique patients
    const patientsResult = await pool.query(
      'SELECT COUNT(DISTINCT patient_id) as count FROM appointments WHERE doctor_id = $1',
      [doctorId]
    );

    // Get monthly revenue (completed appointments only)
    const revenueResult = await pool.query(
      `SELECT COALESCE(SUM(d.consultation_fee), 0) as revenue
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.doctor_id
       WHERE a.doctor_id = $1 AND a.status = 'completed'
       AND DATE_TRUNC('month', a.appointment_date) = DATE_TRUNC('month', CURRENT_DATE)`,
      [doctorId]
    );

    // Get completed appointments count
    const completedResult = await pool.query(
      'SELECT COUNT(*) as count FROM appointments WHERE doctor_id = $1 AND status = $2',
      [doctorId, 'completed']
    );

    // Get average rating
    const ratingResult = await pool.query(
      'SELECT COALESCE(AVG(rating), 0) as avg_rating FROM doctor_reviews WHERE doctor_id = $1',
      [doctorId]
    );

    // In getDashboardStats function, replace the res.json part with:
    res.json({
      pendingAppointments: parseInt(pendingResult.rows[0].count),
      todayAppointments: parseInt(todayResult.rows[0].count),
      totalPatients: parseInt(patientsResult.rows[0].count),
      monthlyRevenue: parseFloat(revenueResult.rows[0].revenue) || 0,
      completedAppointments: parseInt(completedResult.rows[0].count),
      averageRating: parseFloat(ratingResult.rows[0].avg_rating).toFixed(1)
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get doctor's appointments
export const getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.user.userId;
    const { status, date, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        a.appointment_id, a.appointment_date, a.appointment_time, a.duration,
        a.status, a.reason_for_visit, a.consultation_notes, a.created_at,
        p.first_name as patient_first_name, p.last_name as patient_last_name,
        p.phone as patient_phone, p.email as patient_email
      FROM appointments a
      JOIN patients p ON a.patient_id = p.patient_id
      WHERE a.doctor_id = $1
    `;
    
    const queryParams = [doctorId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND a.status = $${paramCount}`;
      queryParams.push(status);
    }

    if (date) {
      paramCount++;
      query += ` AND a.appointment_date = $${paramCount}`;
      queryParams.push(date);
    }

    query += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, queryParams);

    const appointments = result.rows.map(apt => ({
      appointment_id: apt.appointment_id,
      appointment_date: apt.appointment_date,
      appointment_time: apt.appointment_time,
      duration: apt.duration,
      status: apt.status,
      reason_for_visit: apt.reason_for_visit,
      consultation_notes: apt.consultation_notes,
      patient_name: `${apt.patient_first_name} ${apt.patient_last_name}`,
      patient_phone: apt.patient_phone,
      patient_email: apt.patient_email,
      created_at: apt.created_at
    }));

    res.json({ appointments });

  } catch (error) {
    console.error('Get doctor appointments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Accept/Reject appointment
export const updateAppointmentStatus = async (req, res) => {
  try {
    const doctorId = req.user.userId;
    const { appointmentId } = req.params;
    const { action } = req.params; // 'accept' or 'reject'
    const { message } = req.body;

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Use accept or reject.' });
    }

    const newStatus = action === 'accept' ? 'confirmed' : 'rejected';

    // Update appointment status
    const result = await pool.query(
      `UPDATE appointments SET 
        status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE appointment_id = $2 AND doctor_id = $3 AND status = 'pending'
       RETURNING appointment_id, patient_id`,
      [newStatus, appointmentId, doctorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found or already processed' });
    }

    const appointment = result.rows[0];

    // Record the response in appointment_requests table
    await pool.query(
      `INSERT INTO appointment_requests (appointment_id, response_timestamp, doctor_response, response_message)
       VALUES ($1, CURRENT_TIMESTAMP, $2, $3)`,
      [appointmentId, action, message || null]
    );

    // Create notification for patient
    const notificationTitle = action === 'accept' 
      ? 'Appointment Confirmed' 
      : 'Appointment Rejected';
    
    const notificationMessage = action === 'accept'
      ? 'Your appointment has been confirmed by the doctor.'
      : `Your appointment has been rejected. ${message || ''}`;

    await pool.query(
      `INSERT INTO patient_notifications (patient_id, type, title, message)
       VALUES ($1, $2, $3, $4)`,
      [appointment.patient_id, 'appointment_update', notificationTitle, notificationMessage]
    );

    res.json({ message: `Appointment ${action}ed successfully` });

  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get doctor's patients
export const getDoctorPatients = async (req, res) => {
  try {
    const doctorId = req.user.userId;
    const { search, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT DISTINCT
        p.patient_id, p.first_name, p.last_name, p.email, p.phone,
        p.date_of_birth, p.gender, p.blood_group, p.allergies, p.medical_history,
        COUNT(a.appointment_id) as total_visits,
        MAX(a.appointment_date) as last_visit
      FROM patients p
      JOIN appointments a ON p.patient_id = a.patient_id
      WHERE a.doctor_id = $1 AND a.status IN ('completed', 'confirmed')
    `;

    const queryParams = [doctorId];
    let paramCount = 1;

    if (search) {
      paramCount++;
      query += ` AND (p.first_name ILIKE $${paramCount} OR p.last_name ILIKE $${paramCount} OR p.email ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    query += `
      GROUP BY p.patient_id, p.first_name, p.last_name, p.email, p.phone,
               p.date_of_birth, p.gender, p.blood_group, p.allergies, p.medical_history
      ORDER BY last_visit DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, queryParams);

    const patients = result.rows.map(patient => ({
      patient_id: patient.patient_id,
      first_name: patient.first_name,
      last_name: patient.last_name,
      email: patient.email,
      phone: patient.phone,
      date_of_birth: patient.date_of_birth,
      gender: patient.gender,
      blood_group: patient.blood_group,
      allergies: patient.allergies,
      medical_history: patient.medical_history,
      total_visits: parseInt(patient.total_visits),
      last_visit: patient.last_visit
    }));

    res.json({ patients });

  } catch (error) {
    console.error('Get doctor patients error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get doctor's availability schedule
export const getDoctorAvailability = async (req, res) => {
  try {
    const doctorId = req.user.userId;

    const result = await pool.query(
      `SELECT day_of_week, start_time, end_time, break_start_time, break_end_time, is_active
       FROM doctor_availability
       WHERE doctor_id = $1
       ORDER BY day_of_week`,
      [doctorId]
    );

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Create default schedule if none exists
    let schedule = daysOfWeek.map((day, index) => ({
      day,
      start_time: index >= 1 && index <= 5 ? '09:00' : '', // Mon-Fri default
      end_time: index >= 1 && index <= 5 ? '17:00' : '',
      break_start_time: index >= 1 && index <= 5 ? '12:00' : '',
      break_end_time: index >= 1 && index <= 5 ? '13:00' : '',
      is_active: index >= 1 && index <= 5 // Mon-Fri active by default
    }));

    // Override with database data if exists
    result.rows.forEach(row => {
      const dayIndex = row.day_of_week;
      if (dayIndex >= 0 && dayIndex < 7) {
        schedule[dayIndex] = {
          day: daysOfWeek[dayIndex],
          start_time: row.start_time || '',
          end_time: row.end_time || '',
          break_start_time: row.break_start_time || '',
          break_end_time: row.break_end_time || '',
          is_active: row.is_active
        };
      }
    });

    res.json({ schedule });

  } catch (error) {
    console.error('Get doctor availability error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update doctor's availability schedule
export const updateDoctorSchedule = async (req, res) => {
  try {
    const doctorId = req.user.userId;
    const { schedule } = req.body;

    if (!Array.isArray(schedule) || schedule.length !== 7) {
      return res.status(400).json({ error: 'Schedule must be an array of 7 days' });
    }

    // Delete existing schedule
    await pool.query('DELETE FROM doctor_availability WHERE doctor_id = $1', [doctorId]);

    // Insert new schedule
    // In updateDoctorSchedule function, replace the schedule insertion loop with:
    for (let i = 0; i < schedule.length; i++) {
      const day = schedule[i];
      
      if (day.is_active && day.start_time && day.end_time) {
        await pool.query(
          `INSERT INTO doctor_availability 
          (doctor_id, day_of_week, start_time, end_time, break_start_time, break_end_time, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            doctorId,
            i,
            day.start_time,
            day.end_time,
            day.break_start_time || null,
            day.break_end_time || null,
            day.is_active
          ]
        );
      }
    }

    res.json({ message: 'Schedule updated successfully' });

  } catch (error) {
    console.error('Update doctor schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update availability status
export const updateAvailabilityStatus = async (req, res) => {
  try {
    const doctorId = req.user.userId;
    const { availability_status } = req.body;

    if (!['available', 'busy', 'offline'].includes(availability_status)) {
      return res.status(400).json({ error: 'Invalid availability status' });
    }

    await pool.query(
      'UPDATE doctors SET availability_status = $1, updated_at = CURRENT_TIMESTAMP WHERE doctor_id = $2',
      [availability_status, doctorId]
    );

    res.json({ message: 'Availability status updated successfully' });

  } catch (error) {
    console.error('Update availability status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get doctor notifications
export const getDoctorNotifications = async (req, res) => {
  try {
    const doctorId = req.user.userId;
    const { limit = 20, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT notification_id as id, type, title, message, is_read, created_at
       FROM doctor_notifications
       WHERE doctor_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [doctorId, parseInt(limit), parseInt(offset)]
    );

    res.json({ notifications: result.rows });

  } catch (error) {
    console.error('Get doctor notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const doctorId = req.user.userId;
    const { notificationId } = req.params;

    const result = await pool.query(
      `UPDATE doctor_notifications 
       SET is_read = true 
       WHERE notification_id = $1 AND doctor_id = $2
       RETURNING notification_id`,
      [notificationId, doctorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read' });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add this new function to DoctorDashboardController.js
export const getDoctorAvailabilitySlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();

    // Get doctor's availability for the specific day
    const availabilityResult = await pool.query(
      `SELECT start_time, end_time, break_start_time, break_end_time, is_active
       FROM doctor_availability
       WHERE doctor_id = $1 AND day_of_week = $2 AND is_active = true`,
      [doctorId, dayOfWeek]
    );

    if (availabilityResult.rows.length === 0) {
      return res.json({ data: { slots: [] } });
    }

    const availability = availabilityResult.rows[0];
    
    // Get existing appointments for this date
    const appointmentsResult = await pool.query(
      `SELECT appointment_time FROM appointments 
       WHERE doctor_id = $1 AND appointment_date = $2 AND status IN ('confirmed', 'pending')`,
      [doctorId, date]
    );

    const bookedSlots = appointmentsResult.rows.map(apt => apt.appointment_time);

    // Generate time slots (30-minute intervals)
    const slots = [];
    const startTime = new Date(`2000-01-01T${availability.start_time}`);
    const endTime = new Date(`2000-01-01T${availability.end_time}`);
    const breakStart = availability.break_start_time ? new Date(`2000-01-01T${availability.break_start_time}`) : null;
    const breakEnd = availability.break_end_time ? new Date(`2000-01-01T${availability.break_end_time}`) : null;

    let currentTime = new Date(startTime);
    const slotDuration = 30; // 30 minutes

    while (currentTime < endTime) {
      const timeString = currentTime.toTimeString().slice(0, 5); // HH:MM format
      
      // Skip break time slots
      const isBreakTime = breakStart && breakEnd && 
        currentTime >= breakStart && currentTime < breakEnd;
      
      if (!isBreakTime) {
        const isBooked = bookedSlots.includes(timeString);
        
        slots.push({
          time: timeString,
          isBooked: isBooked,
          isAvailable: !isBooked
        });
      }

      currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
    }

    res.json({ data: { slots } });

  } catch (error) {
    console.error('Get doctor availability slots error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};