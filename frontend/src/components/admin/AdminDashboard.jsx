import React, { useState, useEffect } from 'react';
import styles from "../../assets/styles/admin/AdminDashboard.module.css";
import { 
  Users, UserCheck, Calendar,  BarChart3, Settings, Bell, Search, Filter, Eye, CheckCircle, XCircle, TrendingUp,
  Clock,Heart,LogOut,Menu,X,Download,Edit,Trash2,MessageSquare} from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    pendingApprovals: 0,
    totalAppointments: 0,
    totalAnalyses: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

  // API utility function
  const makeAuthenticatedRequest = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('userRole');
          window.location.href = '/admin-login';
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      setError('An error occurred while fetching data');
      throw error;
    }
  };

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      const [patientsRes, doctorsRes, appointmentsRes, analysesRes] = await Promise.all([
        makeAuthenticatedRequest('/admin/patients/count'),
        makeAuthenticatedRequest('/admin/doctors/count'),
        makeAuthenticatedRequest('/admin/appointments/count'),
        makeAuthenticatedRequest('/admin/symptom-analyses/count')
      ]);

      setStats({
        totalPatients: patientsRes.count || 0,
        totalDoctors: doctorsRes.approved || 0,
        pendingApprovals: doctorsRes.pending || 0,
        totalAppointments: appointmentsRes.count || 0,
        totalAnalyses: analysesRes.count || 0
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    }
  };

  // Fetch recent activities
  const fetchRecentActivities = async () => {
    try {
      const response = await makeAuthenticatedRequest('/admin/activities/recent?limit=5');
      setRecentActivities(response.activities || []);
    } catch (error) {
      console.error('Failed to fetch recent activities:', error);
    }
  };

  // Fetch pending doctors
  const fetchPendingDoctors = async () => {
    try {
      const response = await makeAuthenticatedRequest('/admin/doctors/pending');
      setPendingDoctors(response.doctors || []);
    } catch (error) {
      console.error('Failed to fetch pending doctors:', error);
    }
  };

  // Fetch all patients
  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await makeAuthenticatedRequest(`/admin/patients?search=${searchTerm}`);
      setPatients(response.patients || []);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all doctors
  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await makeAuthenticatedRequest('/admin/doctors');
      setDoctors(response.doctors || []);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all appointments
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await makeAuthenticatedRequest('/admin/appointments');
      setAppointments(response.appointments || []);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await makeAuthenticatedRequest('/admin/analytics');
      setAnalytics(response || {});
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await makeAuthenticatedRequest('/admin/notifications');
      setNotifications(response.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  // Handle doctor approval/rejection
  const handleDoctorApproval = async (doctorId, action) => {
    try {
      setLoading(true);
      const endpoint = action === 'approve' ? '/admin/doctors/approve' : '/admin/doctors/reject';
      await makeAuthenticatedRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({ doctorId })
      });
      
      // Refresh pending doctors list
      await fetchPendingDoctors();
      await fetchDashboardStats();

    } catch (error) {
      console.error(`Failed to ${action} doctor:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Handle patient status change
  const handlePatientStatusChange = async (patientId, action) => {
    try {
      setLoading(true);
      await makeAuthenticatedRequest('/admin/patients/status', {
        method: 'PUT',
        body: JSON.stringify({ patientId, action })
      });
      
      // Refresh patients list
      await fetchPatients();
      
    } catch (error) {
      console.error(`Failed to ${action} patient:`, error);
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    window.location.href = '/admin-login';
  };

  // Initial data fetch
  useEffect(() => {
    fetchDashboardStats();
    fetchRecentActivities();
    fetchPendingDoctors();
    fetchNotifications();
  }, []);

  // Fetch data based on active tab
  useEffect(() => {
    switch(activeTab) {
      case 'users':
        fetchPatients();
        break;
      case 'doctors':
        fetchDoctors();
        break;
      case 'appointments':
        fetchAppointments();
        break;
      case 'analytics':
        fetchAnalytics();
        break;
      default:
        break;
    }
  }, [activeTab, searchTerm]);

  const renderOverview = () => (
    <div className={styles["admin-dashboard-overview"]}>
      {/* Stats Cards */}
      <div className={styles["admin-dashboard-stats-grid"]}>
        <div className={styles["admin-dashboard-stat-card"]}>
          <div className={`${styles["admin-dashboard-stat-icon"]} ${styles["admin-dashboard-stat-icon-blue"]}`}>
            <Users size={24} />
          </div>
          <div className={styles["admin-dashboard-stat-content"]}>
            <h3>{stats.totalPatients}</h3>
            <p>Total Patients</p>
            <span className={`${styles["admin-dashboard-stat-change"]} ${styles["admin-dashboard-stat-positive"]}`}>+12% from last month</span>
          </div>
        </div>

        <div className={styles["admin-dashboard-stat-card"]}>
          <div className={`${styles["admin-dashboard-stat-icon"]} ${styles["admin-dashboard-stat-icon-green"]}`}>
            <UserCheck size={24} />
          </div>
          <div className={styles["admin-dashboard-stat-content"]}>
            <h3>{stats.totalDoctors}</h3>
            <p>Total Doctors</p>
            <span className={`${styles["admin-dashboard-stat-change"]} ${styles["admin-dashboard-stat-positive"]}`}>+5% from last month</span>
          </div>
        </div>

        <div className={styles["admin-dashboard-stat-card"]}>
          <div className={`${styles["admin-dashboard-stat-icon"]} ${styles["admin-dashboard-stat-icon-orange"]}`}>
            <Clock size={24} />
          </div>
          <div className={styles["admin-dashboard-stat-content"]}>
            <h3>{stats.pendingApprovals}</h3>
            <p>Pending Approvals</p>
            <span className={`${styles["admin-dashboard-stat-change"]} ${styles["admin-dashboard-stat-neutral"]}`}>Requires attention</span>
          </div>
        </div>

        <div className={styles["admin-dashboard-stat-card"]}>
          <div className={`${styles["admin-dashboard-stat-icon"]} ${styles["admin-dashboard-stat-icon-purple"]}`}>
            <Calendar size={24} />
          </div>
          <div className={styles["admin-dashboard-stat-content"]}>
            <h3>{stats.totalAppointments}</h3>
            <p>Total Appointments</p>
            <span className={`${styles["admin-dashboard-stat-change"]} ${styles["admin-dashboard-stat-positive"]}`}>+8% from last week</span>
          </div>
        </div>

        <div className={styles["admin-dashboard-stat-card"]}>
          <div className={`${styles["admin-dashboard-stat-icon"]} ${styles["admin-dashboard-stat-icon-red"]}`}>
            <BarChart3 size={24} />
          </div>
          <div className={styles["admin-dashboard-stat-content"]}>
            <h3>{stats.totalAnalyses}</h3>
            <p>Symptom Analyses</p>
            <span className={`${styles["admin-dashboard-stat-change"]} ${styles["admin-dashboard-stat-positive"]}`}>+23% from last week</span>
          </div>
        </div>
      </div>

      {/* Recent Activities and Pending Approvals */}
      <div className={styles["admin-dashboard-content-grid"]}>
        <div className={styles["admin-dashboard-card"]}>
          <div className={styles["admin-dashboard-card-header"]}>
            <h3>Recent Activities</h3>
            <button className={styles["admin-dashboard-btn-secondary"]}>View All</button>
          </div>
          <div className={styles["admin-dashboard-activities-list"]}>
            {recentActivities.map(activity => (
              <div key={activity.id} className={styles["admin-dashboard-activity-item"]}>
                <div className={styles["admin-dashboard-activity-icon"]}>
                  <Bell size={16} />
                </div>
                <div className={styles["admin-dashboard-activity-content"]}>
                  <p>{activity.message}</p>
                  <span className={styles["admin-dashboard-activity-time"]}>{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles["admin-dashboard-card"]}>
          <div className={styles["admin-dashboard-card-header"]}>
            <h3>Pending Doctor Approvals</h3>
            <span className={`${styles["admin-dashboard-badge"]} ${styles["admin-dashboard-badge-warning"]}`}>{pendingDoctors.length}</span>
          </div>
          <div className={styles["admin-dashboard-pending-list"]}>
            {pendingDoctors.slice(0, 3).map(doctor => (
              <div key={doctor.doctor_id} className={styles["admin-dashboard-pending-item"]}>
                <div className={styles["admin-dashboard-pending-info"]}>
                  <h4>{doctor.name}</h4>
                  <p>{doctor.specialization}</p>
                  <span className={styles["admin-dashboard-pending-date"]}>Applied: {doctor.applied}</span>
                </div>
                <div className={styles["admin-dashboard-pending-actions"]}>
                  <button 
                    className={`${styles["admin-dashboard-btn-success"]} ${styles["admin-dashboard-btn-sm"]}`}
                    onClick={() => handleDoctorApproval(doctor.doctor_id, 'approve')}
                  >
                    <CheckCircle size={16} />
                  </button>
                  <button 
                    className={`${styles["admin-dashboard-btn-danger"]} ${styles["admin-dashboard-btn-sm"]}`}
                    onClick={() => handleDoctorApproval(doctor.id, 'reject')}
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderUserManagement = () => (
    <div className={styles["admin-dashboard-user-management"]}>
      <div className={styles["admin-dashboard-section-header"]}>
        <h2>User Management</h2>
        <div className={styles["admin-dashboard-header-actions"]}>
          <div className={styles["admin-dashboard-search-box"]}>
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className={styles["admin-dashboard-btn-secondary"]}>
            <Filter size={16} />
            Filter
          </button>
          <button className={styles["admin-dashboard-btn-primary"]}>
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      <div className={styles["admin-dashboard-tabs"]}>
        <button className={`${styles["admin-dashboard-tab"]} ${styles["admin-dashboard-tab-active"]}`}>All Patients</button>
        <button className={styles["admin-dashboard-tab"]}>Active</button>
        <button className={styles["admin-dashboard-tab"]}>Inactive</button>
        <button className={styles["admin-dashboard-tab"]}>Verified</button>
      </div>

      <div className={styles["admin-dashboard-table-container"]}>
        {loading ? (
          <div className={styles["admin-dashboard-loading"]}>Loading patients...</div>
        ) : (
          <table className={styles["admin-dashboard-table"]}>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.length > 0 ? patients.map(patient => (
                <tr key={patient.patient_id}>
                  <td>
                    <div className={styles["admin-dashboard-user-info"]}>
                      <div className={styles["admin-dashboard-avatar"]}>
                        {patient.first_name?.[0]}{patient.last_name?.[0]}
                      </div>
                      <div>
                        <p className={styles["admin-dashboard-user-name"]}>
                          {patient.first_name} {patient.last_name}
                        </p>
                        <span className={styles["admin-dashboard-user-id"]}>ID: #{patient.patient_id}</span>
                      </div>
                    </div>
                  </td>
                  <td>{patient.email}</td>
                  <td>{patient.phone || 'N/A'}</td>
                  <td>{new Date(patient.created_at).toLocaleDateString()}</td>
                  <td>
                    <span className={`${styles["admin-dashboard-status"]} ${patient.is_active ? styles["admin-dashboard-status-active"] : styles["admin-dashboard-status-inactive"]}`}>
                      {patient.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className={styles["admin-dashboard-action-buttons"]}>
                      <button className={styles["admin-dashboard-btn-icon"]}>
                        <Eye size={16} />
                      </button>
                      <button className={styles["admin-dashboard-btn-icon"]}>
                        <Edit size={16} />
                      </button>
                      <button 
                        className={`${styles["admin-dashboard-btn-icon"]} ${styles["admin-dashboard-btn-danger"]}`}
                        onClick={() => handlePatientStatusChange(patient.patient_id, 'deactivate')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className={styles["admin-dashboard-no-data"]}>No patients found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderDoctorManagement = () => (
    <div className={styles["admin-dashboard-doctor-management"]}>
      <div className={styles["admin-dashboard-section-header"]}>
        <h2>Doctor Management</h2>
        <div className={styles["admin-dashboard-header-actions"]}>
          <div className={styles["admin-dashboard-search-box"]}>
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search doctors..." 
            />
          </div>
          <button className={styles["admin-dashboard-btn-secondary"]}>
            <Filter size={16} />
            Filter
          </button>
        </div>
      </div>

      <div className={styles["admin-dashboard-tabs"]}>
        <button className={`${styles["admin-dashboard-tab"]} ${styles["admin-dashboard-tab-active"]}`}>Pending Approval</button>
        <button className={styles["admin-dashboard-tab"]}>Approved</button>
        <button className={styles["admin-dashboard-tab"]}>Rejected</button>
      </div>

      <div className={styles["admin-dashboard-doctor-cards"]}>
        {loading ? (
          <div className={styles["admin-dashboard-loading"]}>Loading doctors...</div>
        ) : pendingDoctors.length > 0 ? (
          pendingDoctors.map(doctor => (
            <div key={doctor.doctor_id} className={styles["admin-dashboard-doctor-card"]}>
              <div className={styles["admin-dashboard-doctor-header"]}>
                <div className={styles["admin-dashboard-doctor-avatar"]}>
                  {doctor.first_name?.[0]}{doctor.last_name?.[0]}
                </div>
                <div className={styles["admin-dashboard-doctor-info"]}>
                  <h3>{doctor.first_name} {doctor.last_name}</h3>
                  <p>{doctor.specialization}</p>
                  <span className={styles["admin-dashboard-doctor-email"]}>{doctor.email}</span>
                </div>
                <div className={styles["admin-dashboard-doctor-status"]}>
                  <span className={`${styles["admin-dashboard-badge"]} ${
                    doctor.approval_status === 'pending' ? styles["admin-dashboard-badge-warning"] :
                    doctor.approval_status === 'approved' ? styles["admin-dashboard-badge-success"] :
                    styles["admin-dashboard-badge-danger"]
                  }`}>
                    {doctor.approval_status}
                  </span>
                </div>
              </div>
              
              <div className={styles["admin-dashboard-doctor-details"]}>
                <div className={styles["admin-dashboard-detail-item"]}>
                  <span>Applied:</span>
                  <span>{new Date(doctor.created_at).toLocaleDateString()}</span>
                </div>
                <div className={styles["admin-dashboard-detail-item"]}>
                  <span>License:</span>
                  <span>{doctor.license_number}</span>
                </div>
                <div className={styles["admin-dashboard-detail-item"]}>
                  <span>Experience:</span>
                  <span>{doctor.experience_years} years</span>
                </div>
              </div>

              <div className={styles["admin-dashboard-doctor-actions"]}>
                <button 
                  className={styles["admin-dashboard-btn-success"]}
                  onClick={() => handleDoctorApproval(doctor.doctor_id, 'approve')}
                  disabled={loading}
                >
                  <CheckCircle size={16} />
                  Approve
                </button>
                <button 
                  className={styles["admin-dashboard-btn-danger"]}
                  onClick={() => handleDoctorApproval(doctor.doctor_id, 'reject')}
                  disabled={loading}
                >
                  <XCircle size={16} />
                  Reject
                </button>
                <button className={styles["admin-dashboard-btn-secondary"]}>
                  <Eye size={16} />
                  Review
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className={styles["admin-dashboard-no-data"]}>No pending doctor applications</div>
        )}
      </div>
    </div>
  );

  const renderAppointmentOversight = () => (
    <div className={styles["admin-dashboard-appointment-oversight"]}>
      <div className={styles["admin-dashboard-section-header"]}>
        <h2>Appointment Oversight</h2>
        <div className={styles["admin-dashboard-header-actions"]}>
          <select className={styles["admin-dashboard-select"]}>
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
          </select>
          <button className={styles["admin-dashboard-btn-primary"]}>
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      <div className={styles["admin-dashboard-appointment-stats"]}>
        <div className={styles["admin-dashboard-appointment-stat"]}>
          <h3>156</h3>
          <p>Total Appointments</p>
          <span className={`${styles["admin-dashboard-stat-trend"]} ${styles["admin-dashboard-trend-up"]}`}>+12%</span>
        </div>
        <div className={styles["admin-dashboard-appointment-stat"]}>
          <h3>89</h3>
          <p>Completed</p>
          <span className={`${styles["admin-dashboard-stat-trend"]} ${styles["admin-dashboard-trend-up"]}`}>+8%</span>
        </div>
        <div className={styles["admin-dashboard-appointment-stat"]}>
          <h3>34</h3>
          <p>Pending</p>
          <span className={`${styles["admin-dashboard-stat-trend"]} ${styles["admin-dashboard-trend-down"]}`}>-5%</span>
        </div>
        <div className={styles["admin-dashboard-appointment-stat"]}>
          <h3>23</h3>
          <p>Cancelled</p>
          <span className={`${styles["admin-dashboard-stat-trend"]} ${styles["admin-dashboard-trend-up"]}`}>+3%</span>
        </div>
      </div>

      <div className={styles["admin-dashboard-appointment-table"]}>
        {loading ? (
          <div className={styles["admin-dashboard-loading"]}>Loading appointments...</div>
        ) : (
          <table className={styles["admin-dashboard-table"]}>
            <thead>
              <tr>
                <th>Appointment ID</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date & Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length > 0 ? appointments.map(appointment => (
                <tr key={appointment.appointment_id}>
                  <td>#{appointment.appointment_id}</td>
                  <td>
                    <div className={styles["admin-dashboard-user-cell"]}>
                      <div className={styles["admin-dashboard-avatar-sm"]}>
                        {appointment.patient_first_name?.[0]}{appointment.patient_last_name?.[0]}
                      </div>
                      <span>{appointment.patient_first_name} {appointment.patient_last_name}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles["admin-dashboard-user-cell"]}>
                      <div className={styles["admin-dashboard-avatar-sm"]}>
                        {appointment.doctor_first_name?.[0]}{appointment.doctor_last_name?.[0]}
                      </div>
                      <span>Dr. {appointment.doctor_first_name} {appointment.doctor_last_name}</span>
                    </div>
                  </td>
                  <td>
                    {new Date(appointment.appointment_date).toLocaleDateString()} - {appointment.appointment_time}
                  </td>
                  <td>
                    <span className={`${styles["admin-dashboard-status"]} ${styles[`admin-dashboard-status-${appointment.status}`]}`}>
                      {appointment.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles["admin-dashboard-action-buttons"]}>
                      <button className={styles["admin-dashboard-btn-icon"]}>
                        <Eye size={16} />
                      </button>
                      <button className={styles["admin-dashboard-btn-icon"]}>
                        <MessageSquare size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className={styles["admin-dashboard-no-data"]}>No appointments found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className={styles["admin-dashboard-analytics"]}>
      <div className={styles["admin-dashboard-section-header"]}>
        <h2>System Analytics</h2>
        <div className={styles["admin-dashboard-header-actions"]}>
          <select className={styles["admin-dashboard-select"]}>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 3 months</option>
          </select>
        </div>
      </div>

      <div className={styles["admin-dashboard-analytics-grid"]}>
        {loading ? (
          <div className={styles["admin-dashboard-loading"]}>Loading analytics...</div>
        ) : (
          <>
            <div className={styles["admin-dashboard-analytics-card"]}>
              <h3>User Registration Trends</h3>
              <div className={styles["admin-dashboard-chart-placeholder"]}>
                <TrendingUp size={48} />
                <p>Registration trends: {analytics.registrationTrend || 'Data loading...'}</p>
              </div>
            </div>

            <div className={styles["admin-dashboard-analytics-card"]}>
              <h3>Most Common Symptoms</h3>
              <div className={styles["admin-dashboard-symptom-list"]}>
                {analytics.commonSymptoms && analytics.commonSymptoms.length > 0 ? 
                  analytics.commonSymptoms.map((symptom, index) => (
                    <div key={index} className={styles["admin-dashboard-symptom-item"]}>
                      <span>{symptom.name}</span>
                      <div className={styles["admin-dashboard-progress-bar"]}>
                        <div className={styles["admin-dashboard-progress"]} style={{width: `${symptom.percentage}%`}}></div>
                      </div>
                      <span>{symptom.percentage}%</span>
                    </div>
                  )) : (
                    <div>No symptom data available</div>
                  )
                }
              </div>
            </div>

            <div className={styles["admin-dashboard-analytics-card"]}>
              <h3>Popular Specialists</h3>
              <div className={styles["admin-dashboard-specialist-stats"]}>
                {analytics.popularSpecialists && analytics.popularSpecialists.length > 0 ?
                  analytics.popularSpecialists.map((specialist, index) => (
                    <div key={index} className={styles["admin-dashboard-specialist-item"]}>
                      <span>{specialist.specialization}</span>
                      <span className={styles["admin-dashboard-specialist-count"]}>{specialist.consultations} consultations</span>
                    </div>
                  )) : (
                    <div>No specialist data available</div>
                  )
                }
              </div>
            </div>

            <div className={styles["admin-dashboard-analytics-card"]}>
              <h3>System Performance</h3>
              <div className={styles["admin-dashboard-performance-metrics"]}>
                <div className={styles["admin-dashboard-metric"]}>
                  <span>Server Uptime</span>
                  <span className={`${styles["admin-dashboard-metric-value"]} ${styles["admin-dashboard-metric-success"]}`}>
                    {analytics.serverUptime || '99.9%'}
                  </span>
                </div>
                <div className={styles["admin-dashboard-metric"]}>
                  <span>Average Response Time</span>
                  <span className={styles["admin-dashboard-metric-value"]}>
                    {analytics.avgResponseTime || '245ms'}
                  </span>
                </div>
                <div className={styles["admin-dashboard-metric"]}>
                  <span>API Success Rate</span>
                  <span className={`${styles["admin-dashboard-metric-value"]} ${styles["admin-dashboard-metric-success"]}`}>
                    {analytics.apiSuccessRate || '99.2%'}
                  </span>
                </div>
              </div>
           </div>
          </>
        )}
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className={styles["admin-dashboard-system-settings"]}>
      <div className={styles["admin-dashboard-section-header"]}>
        <h2>System Settings</h2>
      </div>

      {error && (
        <div className={styles["admin-dashboard-error-message"]}>
          {error}
        </div>
      )}

      <div className={styles["admin-dashboard-settings-grid"]}>
        <div className={styles["admin-dashboard-settings-card"]}>
          <h3>General Settings</h3>
          <div className={styles["admin-dashboard-setting-item"]}>
            <label>System Name</label>
            <input type="text" defaultValue="Smart Healthcare Portal" />
          </div>
          <div className={styles["admin-dashboard-setting-item"]}>
            <label>Maintenance Mode</label>
            <div className={styles["admin-dashboard-toggle"]}>
              <input type="checkbox" />
              <span className={styles["admin-dashboard-toggle-slider"]}></span>
            </div>
          </div>
          <div className={styles["admin-dashboard-setting-item"]}>
            <label>Registration Open</label>
            <div className={styles["admin-dashboard-toggle"]}>
              <input type="checkbox" defaultChecked />
              <span className={styles["admin-dashboard-toggle-slider"]}></span>
            </div>
          </div>
        </div>

        <div className={styles["admin-dashboard-settings-card"]}>
          <h3>Email Settings</h3>
          <div className={styles["admin-dashboard-setting-item"]}>
            <label>SMTP Server</label>
            <input type="text" defaultValue="smtp.gmail.com" />
          </div>
          <div className={styles["admin-dashboard-setting-item"]}>
            <label>Email Notifications</label>
            <div className={styles["admin-dashboard-toggle"]}>
              <input type="checkbox" defaultChecked />
              <span className={styles["admin-dashboard-toggle-slider"]}></span>
            </div>
          </div>
        </div>

        <div className={styles["admin-dashboard-settings-card"]}>
          <h3>Security Settings</h3>
          <div className={styles["admin-dashboard-setting-item"]}>
            <label>Two-Factor Authentication</label>
            <div className={styles["admin-dashboard-toggle"]}>
              <input type="checkbox" />
              <span className={styles["admin-dashboard-toggle-slider"]}></span>
            </div>
          </div>
          <div className={styles["admin-dashboard-setting-item"]}>
            <label>Session Timeout (minutes)</label>
            <input type="number" defaultValue="30" />
          </div>
        </div>

        <div className={styles["admin-dashboard-settings-card"]}>
          <h3>AI Configuration</h3>
          <div className={styles["admin-dashboard-setting-item"]}>
            <label>AI Model</label>
            <select>
              <option>GPT-3.5</option>
              <option>GPT-4</option>
              <option>Custom Model</option>
            </select>
          </div>
          <div className={styles["admin-dashboard-setting-item"]}>
            <label>Confidence Threshold</label>
            <input type="range" min="0" max="100" defaultValue="75" />
            <span>75%</span>
          </div>
        </div>
      </div>

      <div className={styles["admin-dashboard-settings-actions"]}>
        <button className={styles["admin-dashboard-btn-secondary"]} disabled={loading}>
          Reset to Default
        </button>
        <button className={styles["admin-dashboard-btn-primary"]} disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    switch(activeTab) {
      case 'overview': return renderOverview();
      case 'users': return renderUserManagement();
      case 'doctors': return renderDoctorManagement();
      case 'appointments': return renderAppointmentOversight();
      case 'analytics': return renderAnalytics();
      case 'settings': return renderSystemSettings();
      default: return renderOverview();
    }
  };

  return (
    <div className={styles["admin-dashboard-container"]}>
      {/* Sidebar */}
      <aside className={`${styles["admin-dashboard-sidebar"]} ${sidebarOpen ? styles["admin-dashboard-sidebar-open"] : styles["admin-dashboard-sidebar-closed"]}`}>
        <div className={styles["admin-dashboard-sidebar-header"]}>
          <div className={styles["admin-dashboard-logo"]}>
            <Heart className={styles["admin-dashboard-logo-icon"]} />
            <span className={styles["admin-dashboard-logo-text"]}>Smart Healthcare</span>
          </div>
          <button 
            className={styles["admin-dashboard-sidebar-toggle"]}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className={styles["admin-dashboard-nav"]}>
          <button 
            className={`${styles["admin-dashboard-nav-item"]} ${activeTab === 'overview' ? styles["admin-dashboard-nav-item-active"] : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <BarChart3 size={20} />
            <span>Overview</span>
          </button>
          
          <button 
            className={`${styles["admin-dashboard-nav-item"]} ${activeTab === 'users' ? styles["admin-dashboard-nav-item-active"] : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={20} />
            <span>User Management</span>
          </button>
          
          <button 
            className={`${styles["admin-dashboard-nav-item"]} ${activeTab === 'doctors' ? styles["admin-dashboard-nav-item-active"] : ''}`}
            onClick={() => setActiveTab('doctors')}
          >
            <UserCheck size={20} />
            <span>Doctor Management</span>
            {pendingDoctors.length > 0 && (
              <span className={styles["admin-dashboard-nav-badge"]}>{pendingDoctors.length}</span>
            )}
          </button>
          
          <button 
            className={`${styles["admin-dashboard-nav-item"]} ${activeTab === 'appointments' ? styles["admin-dashboard-nav-item-active"] : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            <Calendar size={20} />
            <span>Appointments</span>
          </button>
          
          <button 
            className={`${styles["admin-dashboard-nav-item"]} ${activeTab === 'analytics' ? styles["admin-dashboard-nav-item-active"] : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <TrendingUp size={20} />
            <span>Analytics</span>
          </button>
          
          <button 
            className={`${styles["admin-dashboard-nav-item"]} ${activeTab === 'settings' ? styles["admin-dashboard-nav-item-active"] : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={20} />
            <span>Settings</span>
          </button>
        </nav>

        <div className={styles["admin-dashboard-sidebar-footer"]}>
          <button className={styles["admin-dashboard-logout-btn"]} onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles["admin-dashboard-main"]}>
        {/* Header */}
        <header className={styles["admin-dashboard-header"]}>
          <div className={styles["admin-dashboard-header-left"]}>
            <h1 className={styles["admin-dashboard-page-title"]}>Admin Dashboard</h1>
          </div>
          
          <div className={styles["admin-dashboard-header-right"]}>
            <button className={styles["admin-dashboard-notification-btn"]}>
              <Bell size={20} />
              {notifications.filter(n => n.unread).length > 0 && (
                <span className={styles["admin-dashboard-notification-badge"]}>
                  {notifications.filter(n => n.unread).length}
                </span>
              )}
            </button>
            
            <div className={styles["admin-dashboard-admin-profile"]}>
              <div className={styles["admin-dashboard-admin-avatar"]}>AD</div>
              <div className={styles["admin-dashboard-admin-info"]}>
                <span className={styles["admin-dashboard-admin-name"]}>Admin User</span>
                <span className={styles["admin-dashboard-admin-role"]}>Super Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className={styles["admin-dashboard-content"]}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;