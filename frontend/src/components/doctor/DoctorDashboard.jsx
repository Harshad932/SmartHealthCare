import React, { useState, useEffect } from 'react';
import styles from "../../assets/styles/doctor/DoctorDashboard.module.css";
import { useNavigate } from 'react-router-dom';

const DoctorDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [doctorData, setDoctorData] = useState({});
  const [dashboardStats, setDashboardStats] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Mobile responsiveness states
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = useNavigate();
  const API_BASE_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setSidebarOpen(false); // Close sidebar on desktop
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar when tab changes on mobile
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Close sidebar when clicking outside on mobile
  const handleOverlayClick = () => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('doctorToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadDoctorProfile(),
        loadDashboardStats(),
        loadAppointments(),
        loadPatients(),
        loadAvailability(),
        loadNotifications()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadDoctorProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/doctor/profile`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      setDoctorData(data);
    } catch (error) {
      console.error('Error loading doctor profile:', error);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/doctor/dashboard/stats`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setDashboardStats(data);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  const loadAppointments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/doctor/appointments`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch appointments');
      const data = await response.json();
      setAppointments(data.appointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const loadPatients = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/doctor/patients`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch patients');
      const data = await response.json();
      setPatients(data.patients);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const loadAvailability = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/doctor/availability`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch availability');
      const data = await response.json();
      setAvailability(data.schedule);
    } catch (error) {
      console.error('Error loading availability:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/doctor/notifications`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      setNotifications(data.notifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleAppointmentAction = async (appointmentId, action) => {
    try {
      const response = await fetch(`${API_BASE_URL}/doctor/appointments/${appointmentId}/${action}`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error(`Failed to ${action} appointment`);
      await loadAppointments(); // Reload appointments
    } catch (error) {
      console.error('Error updating appointment:', error);
      setError(`Failed to ${action} appointment`);
    }
  };

  const handleAvailabilityStatusChange = async (status) => {
    try {
      const response = await fetch(`${API_BASE_URL}/doctor/availability/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update availability status');
      setDoctorData(prev => ({ ...prev, availabilityStatus: status }));
    } catch (error) {
      console.error('Error updating availability status:', error);
      setError('Failed to update availability status');
    }
  };

  const handleUpdateProfile = async (profileData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/doctor/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(profileData)
      });
      if (!response.ok) throw new Error('Failed to update profile');
      await loadDoctorProfile(); // Reload profile
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    }
  };

  const handleUpdateSchedule = async (scheduleData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/doctor/availability/schedule`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ schedule: scheduleData })
      });
      if (!response.ok) throw new Error('Failed to update schedule');
      await loadAvailability(); // Reload availability

    } catch (error) {
      console.error('Error updating schedule:', error);
      setError('Failed to update schedule');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('doctorToken');
    localStorage.removeItem('doctorData');
    navigate('/doctor-login');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'confirmed': return '#4caf50';
      case 'completed': return '#2196f3';
      case 'cancelled': return '#f44336';
      case 'rejected': return '#e91e63';
      default: return '#757575';
    }
  };

  const renderOverviewTab = () => (
    <div className={styles["doctor-dashboard-overview-content"]}>
      {/* Welcome Section */}
      <div className={styles["doctor-dashboard-welcome-section"]}>
        <div className={styles["doctor-dashboard-welcome-text"]}>
          <h1>Welcome back, {doctorData.first_name} {doctorData.last_name}</h1>
          <p>Here's what's happening with your practice today</p>
        </div>
        <div className={styles["doctor-dashboard-availability-toggle"]}>
          <label>Availability Status:</label>
          <select 
            value={doctorData.availability_status || 'available'}
            onChange={(e) => handleAvailabilityStatusChange(e.target.value)}
            className={styles["doctor-dashboard-status-select"]}
          >
            <option value="available">Available</option>
            <option value="busy">Busy</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className={styles["doctor-dashboard-stats-grid"]}>
        <div className={styles["doctor-dashboard-stat-card"]}>
          <div className={styles["doctor-dashboard-stat-icon"]}>📋</div>
          <div className={styles["doctor-dashboard-stat-info"]}>
            <h3>{dashboardStats.pendingAppointments || 0}</h3>
            <p>Pending Requests</p>
          </div>
        </div>
        
        <div className={styles["doctor-dashboard-stat-card"]}>
          <div className={styles["doctor-dashboard-stat-icon"]}>📅</div>
          <div className={styles["doctor-dashboard-stat-info"]}>
            <h3>{dashboardStats.todayAppointments || 0}</h3>
            <p>Today's Appointments</p>
          </div>
        </div>
        
        <div className={styles["doctor-dashboard-stat-card"]}>
          <div className={styles["doctor-dashboard-stat-icon"]}>👥</div>
          <div className={styles["doctor-dashboard-stat-info"]}>
            <h3>{dashboardStats.totalPatients || 0}</h3>
            <p>Total Patients</p>
          </div>
        </div>
        
        <div className={styles["doctor-dashboard-stat-card"]}>
          <div className={styles["doctor-dashboard-stat-icon"]}>💰</div>
          <div className={styles["doctor-dashboard-stat-info"]}>
            <h3>₹{(dashboardStats.monthlyRevenue || 0).toLocaleString()}</h3>
            <p>Monthly Revenue</p>
          </div>
        </div>
        
        <div className={styles["doctor-dashboard-stat-card"]}>
          <div className={styles["doctor-dashboard-stat-icon"]}>✅</div>
          <div className={styles["doctor-dashboard-stat-info"]}>
            <h3>{dashboardStats.completedAppointments || 0}</h3>
            <p>Completed</p>
          </div>
        </div>
        
        <div className={styles["doctor-dashboard-stat-card"]}>
          <div className={styles["doctor-dashboard-stat-icon"]}>⭐</div>
          <div className={styles["doctor-dashboard-stat-info"]}>
            <h3>{dashboardStats.averageRating || 0}</h3>
            <p>Average Rating</p>
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className={styles["doctor-dashboard-today-schedule"]}>
        <h2>Today's Schedule</h2>
        <div className={styles["doctor-dashboard-schedule-list"]}>
          {appointments.filter(apt => apt.appointment_date === new Date().toISOString().split('T')[0]).map(appointment => (
            <div key={appointment.appointment_id} className={styles["doctor-dashboard-schedule-item"]}>
              <div className={styles["doctor-dashboard-schedule-time"]}>
                {formatTime(appointment.appointment_time)}
              </div>
              <div className={styles["doctor-dashboard-schedule-details"]}>
                <h4>{appointment.patient_name}</h4>
                <p>{appointment.reason_for_visit}</p>
              </div>
              <div className={styles["doctor-dashboard-schedule-status"]} style={{ color: getStatusColor(appointment.status) }}>
                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Notifications */}
      <div className={styles["doctor-dashboard-recent-notifications"]}>
        <h2>Recent Notifications</h2>
        <div className={styles["doctor-dashboard-notifications-list"]}>
          {notifications.slice(0, 3).map(notification => (
            <div key={notification.notification_id} className={`${styles["doctor-dashboard-notification-item"]} ${!notification.is_read ? styles["unread"] : ''}`}>
              <div className={styles["doctor-dashboard-notification-icon"]}>
                {notification.type === 'appointment_request' && '📋'}
                {notification.type === 'patient_message' && '💬'}
                {notification.type === 'system' && '🔔'}
              </div>
              <div className={styles["doctor-dashboard-notification-content"]}>
                <h4>{notification.title}</h4>
                <p>{notification.message}</p>
                <span className={styles["doctor-dashboard-notification-time"]}>
                  {formatDate(notification.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAppointmentsTab = () => (
    <div className={styles["doctor-dashboard-appointments-content"]}>
      <div className={styles["doctor-dashboard-appointments-header"]}>
        <h2>Appointment Management</h2>
        <div className={styles["doctor-dashboard-appointments-filters"]}>
          <button className={`${styles["doctor-dashboard-filter-btn"]} ${styles["active"]}`}>All</button>
          <button className={styles["doctor-dashboard-filter-btn"]}>Pending</button>
          <button className={styles["doctor-dashboard-filter-btn"]}>Confirmed</button>
          <button className={styles["doctor-dashboard-filter-btn"]}>Completed</button>
        </div>
      </div>

      <div className={styles["doctor-dashboard-appointments-list"]}>
        {appointments.map(appointment => (
          <div key={appointment.appointment_id} className={styles["doctor-dashboard-appointment-card"]}>
            <div className={styles["doctor-dashboard-appointment-header"]}>
              <div className={styles["doctor-dashboard-appointment-patient"]}>
                <h3>{appointment.patient_name}</h3>
                <p>{appointment.patient_phone}</p>
              </div>
              <div className={styles["doctor-dashboard-appointment-status"]} style={{ color: getStatusColor(appointment.status) }}>
                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
              </div>
            </div>
            
            <div className={styles["doctor-dashboard-appointment-details"]}>
              <div className={styles["doctor-dashboard-appointment-datetime"]}>
                <span className={styles["doctor-dashboard-appointment-date"]}>
                  📅 {formatDate(appointment.appointment_date)}
                </span>
                <span className={styles["doctor-dashboard-appointment-time"]}>
                  🕐 {formatTime(appointment.appointment_time)}
                </span>
              </div>
              
              <div className={styles["doctor-dashboard-appointment-reason"]}>
                <h4>Reason for Visit:</h4>
                <p>{appointment.reason_for_visit}</p>
              </div>
            </div>
            
            {appointment.status === 'pending' && (
              <div className={styles["doctor-dashboard-appointment-actions"]}>
                <button 
                  className={styles["doctor-dashboard-accept-btn"]}
                  onClick={() => handleAppointmentAction(appointment.appointment_id, 'accept')}
                >
                  Accept
                </button>
                <button 
                  className={styles["doctor-dashboard-reject-btn"]}
                  onClick={() => handleAppointmentAction(appointment.appointment_id, 'reject')}
                >
                  Reject
                </button>
                <button className={styles["doctor-dashboard-reschedule-btn"]}>
                  Reschedule
                </button>
              </div>
            )}
            
            {appointment.status === 'confirmed' && (
              <div className={styles["doctor-dashboard-appointment-actions"]}>
                <button className={styles["doctor-dashboard-start-consultation-btn"]} onClick={() => navigate(`/aura?appointmentId=${appointment.appointment_id}`)}>
                  Start Consultation
                </button>
                <button className={styles["doctor-dashboard-cancel-btn"]}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderPatientsTab = () => (
    <div className={styles["doctor-dashboard-patients-content"]}>
      <div className={styles["doctor-dashboard-patients-header"]}>
        <h2>Patient Management</h2>
        <div className={styles["doctor-dashboard-patients-search"]}>
          <input 
            type="text" 
            placeholder="Search patients..." 
            className={styles["doctor-dashboard-search-input"]}
          />
          <button className={styles["doctor-dashboard-search-btn"]}>🔍</button>
        </div>
      </div>

      <div className={styles["doctor-dashboard-patients-list"]}>
        {patients.map(patient => (
          <div key={patient.patient_id} className={styles["doctor-dashboard-patient-card"]}>
            <div className={styles["doctor-dashboard-patient-avatar"]}>
              <div className={styles["doctor-dashboard-avatar-placeholder"]}>
                {patient.first_name?.charAt(0)}{patient.last_name?.charAt(0)}
              </div>
            </div>
            
            <div className={styles["doctor-dashboard-patient-info"]}>
              <h3>{patient.first_name} {patient.last_name}</h3>
              <p>{patient.email}</p>
              <p>{patient.phone}</p>
            </div>
            
            <div className={styles["doctor-dashboard-patient-stats"]}>
              <div className={styles["doctor-dashboard-patient-stat"]}>
                <span className={styles["doctor-dashboard-stat-label"]}>Last Visit</span>
                <span className={styles["doctor-dashboard-stat-value"]}>{formatDate(patient.last_visit)}</span>
              </div>
              <div className={styles["doctor-dashboard-patient-stat"]}>
                <span className={styles["doctor-dashboard-stat-label"]}>Total Visits</span>
                <span className={styles["doctor-dashboard-stat-value"]}>{patient.total_visits}</span>
              </div>
            </div>
            
            <div className={styles["doctor-dashboard-patient-history"]}>
              <h4>Medical History</h4>
              <p>{patient.medical_history}</p>
            </div>
            
            <div className={styles["doctor-dashboard-patient-actions"]}>
              <button className={styles["doctor-dashboard-view-records-btn"]}>
                View Records
              </button>
              <button className={styles["doctor-dashboard-add-notes-btn"]}>
                Add Notes
              </button>
              <button className={styles["doctor-dashboard-prescribe-btn"]}>
                Prescribe
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderScheduleTab = () => (
    <div className={styles["doctor-dashboard-schedule-content"]}>
      <div className={styles["doctor-dashboard-schedule-header"]}>
        <h2>Schedule Management</h2>
        <button className={styles["doctor-dashboard-add-schedule-btn"]}>
          Add Schedule
        </button>
      </div>

      <div className={styles["doctor-dashboard-availability-section"]}>
        <h3>Weekly Availability</h3>
        <div className={styles["doctor-dashboard-availability-grid"]}>
          {availability.map((schedule, index) => (
            <div key={index} className={styles["doctor-dashboard-day-schedule"]}>
              <div className={styles["doctor-dashboard-day-header"]}>
                <h4>{schedule.day}</h4>
                <label className={styles["doctor-dashboard-toggle-switch"]}>
                  <input 
                    type="checkbox" 
                    checked={schedule.is_active}
                    onChange={(e) => {
                      const newAvailability = [...availability];
                      newAvailability[index].is_active = e.target.checked;
                      setAvailability(newAvailability);
                    }}
                  />
                  <span className={styles["doctor-dashboard-toggle-slider"]}></span>
                </label>
              </div>
              
              {schedule.is_active && (
                <div className={styles["doctor-dashboard-time-inputs"]}>
                  <div className={styles["doctor-dashboard-time-group"]}>
                    <label>Start Time</label>
                    <input 
                      type="time" 
                      value={schedule.start_time}
                      onChange={(e) => {
                        const newAvailability = [...availability];
                        newAvailability[index].start_time = e.target.value;
                        setAvailability(newAvailability);
                      }}
                      className={styles["doctor-dashboard-time-input"]}
                    />
                  </div>
                  
                  <div className={styles["doctor-dashboard-time-group"]}>
                    <label>End Time</label>
                    <input 
                      type="time" 
                      value={schedule.end_time}
                      onChange={(e) => {
                        const newAvailability = [...availability];
                        newAvailability[index].end_time = e.target.value;
                        setAvailability(newAvailability);
                      }}
                      className={styles["doctor-dashboard-time-input"]}
                    />
                  </div>
                  
                  <div className={styles["doctor-dashboard-time-group"]}>
                    <label>Break Start</label>
                    <input 
                      type="time" 
                      value={schedule.break_start_time}
                      onChange={(e) => {
                        const newAvailability = [...availability];
                        newAvailability[index].break_start_time = e.target.value;
                        setAvailability(newAvailability);
                      }}
                      className={styles["doctor-dashboard-time-input"]}
                    />
                  </div>
                  
                  <div className={styles["doctor-dashboard-time-group"]}>
                    <label>Break End</label>
                    <input 
                      type="time" 
                      value={schedule.break_end_time}
                      onChange={(e) => {
                        const newAvailability = [...availability];
                        newAvailability[index].break_end_time = e.target.value;
                        setAvailability(newAvailability);
                      }}
                      className={styles["doctor-dashboard-time-input"]}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className={styles["doctor-dashboard-schedule-actions"]}>
          <button 
            className={styles["doctor-dashboard-save-schedule-btn"]}
            onClick={() => handleUpdateSchedule(availability)}
          >
            Save Schedule
          </button>
          <button className={styles["doctor-dashboard-reset-schedule-btn"]}>
            Reset to Default
          </button>
        </div>
      </div>

      {/* Calendar View */}
      <div className={styles["doctor-dashboard-calendar-section"]}>
        <h3>Calendar View</h3>
        <div className={styles["doctor-dashboard-calendar-placeholder"]}>
          <p>Calendar component would be integrated here</p>
          <p>Showing appointments, blocked times, and availability</p>
        </div>
      </div>
    </div>
  );

  const renderProfileTab = () => (
    <div className={styles["doctor-dashboard-profile-content"]}>
      <div className={styles["doctor-dashboard-profile-header"]}>
        <h2>Profile Settings</h2>
      </div>

      <div className={styles["doctor-dashboard-profile-sections"]}>
        {/* Personal Information */}
        <div className={styles["doctor-dashboard-profile-section"]}>
          <h3>Personal Information</h3>
          <div className={styles["doctor-dashboard-profile-form"]}>
            <div className={styles["doctor-dashboard-form-row"]}>
              <div className={styles["doctor-dashboard-form-group"]}>
                <label>First Name</label>
                <input 
                  type="text" 
                  value={doctorData.first_name || ''}
                  onChange={(e) => setDoctorData(prev => ({ ...prev, first_name: e.target.value }))}
                  className={styles["doctor-dashboard-form-input"]}
                />
              </div>
              <div className={styles["doctor-dashboard-form-group"]}>
                <label>Last Name</label>
                <input 
                  type="text" 
                  value={doctorData.last_name || ''}
                  onChange={(e) => setDoctorData(prev => ({ ...prev, last_name: e.target.value }))}
                  className={styles["doctor-dashboard-form-input"]}
                />
              </div>
            </div>
            
            <div className={styles["doctor-dashboard-form-group"]}>
              <label>Specialization</label>
              <select 
                value={doctorData.specialization || ''}
                onChange={(e) => setDoctorData(prev => ({ ...prev, specialization: e.target.value }))}
                className={styles["doctor-dashboard-form-select"]}
              >
                <option value="Cardiology">Cardiology</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Neurology">Neurology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Pediatrics">Pediatrics</option>
              </select>
            </div>
            
            <div className={styles["doctor-dashboard-form-group"]}>
              <label>Bio</label>
              <textarea 
                className={styles["doctor-dashboard-form-textarea"]}
                rows="4"
                value={doctorData.bio || ''}
                onChange={(e) => setDoctorData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell patients about your experience and approach..."
              ></textarea>
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div className={styles["doctor-dashboard-profile-section"]}>
          <h3>Professional Information</h3>
          <div className={styles["doctor-dashboard-profile-form"]}>
            <div className={styles["doctor-dashboard-form-row"]}>
              <div className={styles["doctor-dashboard-form-group"]}>
                <label>License Number</label>
                <input 
                  type="text" 
                  value={doctorData.license_number || ''}
                  onChange={(e) => setDoctorData(prev => ({ ...prev, license_number: e.target.value }))}
                  className={styles["doctor-dashboard-form-input"]}
                  placeholder="Medical license number"
                />
              </div>
              <div className={styles["doctor-dashboard-form-group"]}>
                <label>Experience Years</label>
                <input 
                  type="number" 
                  value={doctorData.experience_years || ''}
                  onChange={(e) => setDoctorData(prev => ({ ...prev, experience_years: e.target.value }))}
                  className={styles["doctor-dashboard-form-input"]}
                  placeholder="Years of experience"
                />
              </div>
            </div>
            
            <div className={styles["doctor-dashboard-form-row"]}>
              <div className={styles["doctor-dashboard-form-group"]}>
                <label>Consultation Fee</label>
                <input 
                  type="number" 
                  value={doctorData.consultation_fee || ''}
                  onChange={(e) => setDoctorData(prev => ({ ...prev, consultation_fee: e.target.value }))}
                  className={styles["doctor-dashboard-form-input"]}
                  placeholder="Fee in ₹"
                />
              </div>
              <div className={styles["doctor-dashboard-form-group"]}>
                <label>Qualification</label>
                <input 
                  type="text" 
                  value={doctorData.qualification || ''}
                  onChange={(e) => setDoctorData(prev => ({ ...prev, qualification: e.target.value }))}
                  className={styles["doctor-dashboard-form-input"]}
                  placeholder="MBBS, MD, etc."
                />
              </div>
            </div>
            
            <div className={styles["doctor-dashboard-form-group"]}>
              <label>Clinic Address</label>
              <textarea 
                className={styles["doctor-dashboard-form-textarea"]}
                rows="3"
                value={doctorData.clinic_address || ''}
                onChange={(e) => setDoctorData(prev => ({ ...prev, clinic_address: e.target.value }))}
                placeholder="Enter clinic address"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className={styles["doctor-dashboard-profile-section"]}>
          <h3>Account Settings</h3>
          <div className={styles["doctor-dashboard-profile-form"]}>
            <div className={styles["doctor-dashboard-form-group"]}>
              <label>Email</label>
              <input 
                type="email" 
                value={doctorData.email || ''}
                onChange={(e) => setDoctorData(prev => ({ ...prev, email: e.target.value }))}
                className={styles["doctor-dashboard-form-input"]}
                placeholder="doctor@example.com"
              />
            </div>
            
            <div className={styles["doctor-dashboard-form-group"]}>
              <label>Phone</label>
              <input 
                type="tel" 
                value={doctorData.phone || ''}
                onChange={(e) => setDoctorData(prev => ({ ...prev, phone: e.target.value }))}
                className={styles["doctor-dashboard-form-input"]}
                placeholder="+1234567890"
              />
            </div>
            
            <div className={styles["doctor-dashboard-form-group"]}>
              <label>Change Password</label>
              <input 
                type="password" 
                className={styles["doctor-dashboard-form-input"]}
                placeholder="New password"
              />
            </div>
          </div>
        </div>

        <div className={styles["doctor-dashboard-profile-actions"]}>
          <button 
            className={styles["doctor-dashboard-save-profile-btn"]}
            onClick={() => handleUpdateProfile(doctorData)}
          >
            Save Changes
          </button>
          <button className={styles["doctor-dashboard-cancel-profile-btn"]}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className={styles["doctor-dashboard-container"]}>
      {/* Mobile Menu Button */}
      {isMobile && (
        <button 
          className={styles["doctor-dashboard-mobile-menu-btn"]}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            zIndex: 1001,
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '18px',
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
          }}
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className={styles["doctor-dashboard-mobile-overlay"]}
          onClick={handleOverlayClick}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
          }}
        />
      )}

      {/* Sidebar Navigation */}
      <div 
        className={styles["doctor-dashboard-sidebar"]}
        style={{
          transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
          transition: 'transform 0.3s ease-in-out',
          position: isMobile ? 'fixed' : 'relative',
          zIndex: isMobile ? 1000 : 'auto',
          height: isMobile ? '100vh' : 'auto',
          width: isMobile ? '280px' : 'auto',
          top: isMobile ? 0 : 'auto',
          left: isMobile ? 0 : 'auto',
          backgroundColor: isMobile ? 'white' : 'transparent',
          boxShadow: isMobile ? '2px 0 10px rgba(0,0,0,0.1)' : 'none'
        }}
      >
        <div className={styles["doctor-dashboard-logo"]}>
          <h2>Smart Healthcare</h2>
          <p>Doctor Portal</p>
        </div>
        
        <div className={styles["doctor-dashboard-doctor-info"]}>
          <div className={styles["doctor-dashboard-doctor-avatar"]}>
            <div className={styles["doctor-dashboard-avatar-placeholder"]}>
              {doctorData.first_name?.charAt(0)}{doctorData.last_name?.charAt(0)}
            </div>
          </div>
          <div className={styles["doctor-dashboard-doctor-details"]}>
            <h3>{doctorData.first_name} {doctorData.last_name}</h3>
            <p>{doctorData.specialization}</p>
            <span className={`${styles["doctor-dashboard-status-badge"]} ${styles[doctorData.availability_status]}`}>
              {doctorData.availability_status}
            </span>
          </div>
        </div>

        <nav className={styles["doctor-dashboard-nav"]}>
          <button 
            className={`${styles["doctor-dashboard-nav-item"]} ${activeTab === 'overview' ? styles["active"] : ''}`}
            onClick={() => handleTabChange('overview')}
          >
            <span className={styles["doctor-dashboard-nav-icon"]}>🏠</span>
            Overview
          </button>
          
          <button 
            className={`${styles["doctor-dashboard-nav-item"]} ${activeTab === 'appointments' ? styles["active"] : ''}`}
            onClick={() => handleTabChange('appointments')}
          >
            <span className={styles["doctor-dashboard-nav-icon"]}>📅</span>
            Appointments
            {dashboardStats.pendingAppointments > 0 && (
              <span className={styles["doctor-dashboard-notification-badge"]}>
                {dashboardStats.pendingAppointments}
              </span>
            )}
          </button>
          
          <button 
            className={`${styles["doctor-dashboard-nav-item"]} ${activeTab === 'patients' ? styles["active"] : ''}`}
            onClick={() => handleTabChange('patients')}
          >
            <span className={styles["doctor-dashboard-nav-icon"]}>👥</span>
            Patients
          </button>
          
          <button 
            className={`${styles["doctor-dashboard-nav-item"]} ${activeTab === 'schedule' ? styles["active"] : ''}`}
            onClick={() => handleTabChange('schedule')}
          >
            <span className={styles["doctor-dashboard-nav-icon"]}>🗓️</span>
            Schedule
          </button>
          
          <button 
            className={`${styles["doctor-dashboard-nav-item"]} ${activeTab === 'profile' ? styles["active"] : ''}`}
            onClick={() => handleTabChange('profile')}
          >
            <span className={styles["doctor-dashboard-nav-icon"]}>⚙️</span>
            Profile
          </button>
        </nav>

        <div className={styles["doctor-dashboard-sidebar-footer"]}>
          <button className={styles["doctor-dashboard-logout-btn"]} onClick={handleLogout}>
            <span className={styles["doctor-dashboard-nav-icon"]}>🚪</span>
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div 
        className={styles["doctor-dashboard-main"]}
        style={{
          marginLeft: isMobile ? 0 : 'auto',
          width: isMobile ? '100%' : 'auto',
          padding: isMobile ? '80px 20px 20px 20px' : 'auto'
        }}
      >
        <div className={styles["doctor-dashboard-header"]}>
          <div className={styles["doctor-dashboard-header-left"]}>
            <h1 className={styles["doctor-dashboard-page-title"]}>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
          </div>
          
          <div 
            className={styles["doctor-dashboard-header-right"]}
            style={{
              display: isMobile ? 'none' : 'flex'
            }}
          >
            <div className={styles["doctor-dashboard-notifications-icon"]}>
              🔔
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span className={styles["doctor-dashboard-notification-count"]}>
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </div>
            
            <div className={styles["doctor-dashboard-current-date"]}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>

        {/* Mobile Header Info */}
        {isMobile && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            padding: '10px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                🔔
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    backgroundColor: '#ff4444',
                    color: 'white',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {notifications.filter(n => !n.is_read).length}
                  </span>
                )}
              </div>
              <span className={`${styles["doctor-dashboard-status-badge"]} ${styles[doctorData.availability_status]}`} style={{
                fontSize: '12px',
                padding: '4px 8px'
              }}>
                {doctorData.availability_status}
              </span>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className={styles["doctor-dashboard-content"]}>
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'appointments' && renderAppointmentsTab()}
          {activeTab === 'patients' && renderPatientsTab()}
          {activeTab === 'schedule' && renderScheduleTab()}
          {activeTab === 'profile' && renderProfileTab()}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;