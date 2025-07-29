import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../assets/styles/patient/PatientDashboard.css';
import { 
  User, Calendar, FileText, Upload, Download, Trash2, Eye, MessageCircle, Activity, Clock, Phone, Mail, MapPin, Heart, 
  AlertCircle, Plus, Search, Bell, Settings, LogOut, Stethoscope, FileImage, File, X
} from 'lucide-react';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [symptomHistory, setSymptomHistory] = useState([]);
  const [uploadModal, setUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadCategory, setUploadCategory] = useState('report');
  const [loading, setLoading] = useState(false);
  const [documentViewModal, setDocumentViewModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [appointmentsPagination, setAppointmentsPagination] = useState({});
  const [documentsPagination, setDocumentsPagination] = useState({});
  const [documentFilters, setDocumentFilters] = useState({ category: '', search: '' });
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({ date: '', time: '', reason: '' });
  const [cancelReason, setCancelReason] = useState('');

  const API_BASE_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      loadUserProfile();
      
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
    } else {
      navigate('/login');
      return;
    }
    
    // Load dashboard data
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'appointments') {
      loadAppointments();
    } else if (activeTab === 'documents') {
      loadDocuments();
    } else if (activeTab === 'symptoms') {
      loadSymptomHistory();
    }
  }, [activeTab]);

  const getProperDownloadUrl = (document) => {
  if (document.download_url) {
    return document.download_url;
  }
  
  // Fallback: construct download URL
  if (document.file_type === 'application/pdf' || 
      document.file_type.includes('application/') ||
      document.file_type.includes('text/')) {
    return `${document.cloudinary_url}?fl_attachment:${encodeURIComponent(document.file_name)}`;
  }
  
  return document.cloudinary_url;
};

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const canRescheduleAppointment = (status) => {
  return status === 'pending';
};

const canCancelAppointment = (status) => {
  return ['pending'].includes(status);
};

// Reschedule appointment function
const handleRescheduleAppointment = async (appointmentId, currentAppointment) => {
  setSelectedAppointment(currentAppointment);
  setRescheduleModal(true);
};

const submitReschedule = async () => {
  if (!rescheduleForm.date || !rescheduleForm.time) {
    alert('Date and time are required');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/patient/appointments/${selectedAppointment.appointment_id}/reschedule`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        newDate: rescheduleForm.date,
        newTime: rescheduleForm.time,
        reason: rescheduleForm.reason
      })
    });

    if (response.ok) {
      alert('Appointment rescheduled successfully!');
      setRescheduleModal(false);
      setRescheduleForm({ date: '', time: '', reason: '' });
      loadAppointments();
    } else {
      const error = await response.json();
      alert(`Reschedule failed: ${error.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    alert('Reschedule failed. Please try again.');
  }
};

// Updated cancel appointment function
const handleCancelAppointment = async (appointmentId, appointment) => {
  setSelectedAppointment(appointment);
  setCancelModal(true);
};

const submitCancellation = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/patient/appointments/${selectedAppointment.appointment_id}/cancel`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason: cancelReason })
    });

    if (response.ok) {
      alert('Appointment cancelled successfully!');
      setCancelModal(false);
      setCancelReason('');
      loadAppointments();
    } else {
      const error = await response.json();
      alert(`Cancellation failed: ${error.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    alert('Cancellation failed. Please try again.');
  }
};

  const loadDashboardData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/patient/overview`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const result = await response.json();
        setDashboardData(result.data);
        // Set recent data for overview tab
        setAppointments(result.data.recentAppointments || []);
        setNotifications(result.data.recentNotifications || []);
        setSymptomHistory(result.data.recentSymptoms || []);
      } else if (response.status === 401) {
        navigate('/login');
      } else {
        console.error('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/patient/profile`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const result = await response.json();
        console.log('User profile:', result.data.profile);
        setUser(result.data.profile);
      } else {
        console.error('Failed to load user profile');
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadAppointments = async (page = 1, status = '') => {
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '10' });
      if (status) params.append('status', status);

      const response = await fetch(`${API_BASE_URL}/patient/appointments?${params}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const result = await response.json();
        setAppointments(result.data.appointments);
        setAppointmentsPagination(result.data.pagination);
      } else {
        console.error('Failed to load appointments');
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  const loadDocuments = async (page = 1) => {
    try {
      const params = new URLSearchParams({ 
        page: page.toString(), 
        limit: '12',
        ...(documentFilters.category && { category: documentFilters.category }),
        ...(documentFilters.search && { search: documentFilters.search })
      });

      const response = await fetch(`${API_BASE_URL}/patient/documents?${params}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const result = await response.json();
        setDocuments(result.data.documents);
        setDocumentsPagination(result.data.pagination);
      } else {
        console.error('Failed to load documents');
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/patient/notifications`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const result = await response.json();
        setNotifications(result.data.notifications || []);
      } else {
        console.error('Failed to load notifications');
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadSymptomHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/patient/symptoms`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const result = await response.json();
        setSymptomHistory(result.data.symptoms || []);
      } else {
        console.error('Failed to load symptom history');
      }
    } catch (error) {
      console.error('Error loading symptom history:', error);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleDocumentUpload = async () => {
    if (selectedFiles.length === 0) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      selectedFiles.forEach(file => {
        formData.append('documents', file);
      });
      formData.append('category', uploadCategory);

      const response = await fetch(`${API_BASE_URL}/patient/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        await loadDocuments();
        setUploadModal(false);
        setSelectedFiles([]);
        // Show success message
        alert('Documents uploaded successfully!');
      } else {
        const error = await response.json();
        alert(`Upload failed: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentDelete = async (documentId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/patient/documents/${documentId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });

        if (response.ok) {
          await loadDocuments();
          alert('Document deleted successfully!');
        } else {
          const error = await response.json();
          alert(`Delete failed: ${error.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Delete error:', error);
        alert('Delete failed. Please try again.');
      }
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/patient/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => 
            notif.notification_id === notificationId 
              ? { ...notif, is_read: true }
              : notif
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDocumentSearch = (e) => {
    const search = e.target.value;
    setDocumentFilters(prev => ({ ...prev, search }));
    
    // Debounce search
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      loadDocuments(1);
    }, 500);
  };

  const handleCategoryFilter = (e) => {
    const category = e.target.value;
    setDocumentFilters(prev => ({ ...prev, category }));
    loadDocuments(1);
  };

  const getFileIcon = (fileType) => {
    const type = fileType?.toLowerCase();
    if (type?.includes('pdf')) {
      return <File className="patient-dashboard-file-icon" />;
    } else if (type?.includes('image') || ['jpg', 'jpeg', 'png', 'gif'].includes(type)) {
      return <FileImage className="patient-dashboard-file-icon" />;
    } else {
      return <File className="patient-dashboard-file-icon" />;
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      confirmed: { className: 'patient-dashboard-status-confirmed', text: 'Confirmed' },
      pending: { className: 'patient-dashboard-status-pending', text: 'Pending' },
      completed: { className: 'patient-dashboard-status-completed', text: 'Completed' },
      cancelled: { className: 'patient-dashboard-status-cancelled', text: 'Cancelled' },
      rejected: { className: 'patient-dashboard-status-cancelled', text: 'Rejected' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`patient-dashboard-status-badge ${config.className}`}>{config.text}</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="patient-dashboard-loading">
        <div className="patient-dashboard-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="patient-dashboard-container">
      {/* Header */}
      <header className="patient-dashboard-header">
        <div className="patient-dashboard-header-left">
          <div className="patient-dashboard-logo">
            <Heart className="patient-dashboard-logo-icon" />
            <span className="patient-dashboard-logo-text">Smart Healthcare</span>
          </div>
        </div>
        
        <div className="patient-dashboard-header-right">
          <button 
            className="patient-dashboard-notification-btn"
            onClick={() => setActiveTab('notifications')}
          >
            <Bell className="patient-dashboard-notification-icon" />
            {unreadCount > 0 && (
              <span className="patient-dashboard-notification-badge">
                {unreadCount}
              </span>
            )}
          </button>
          
          <div className="patient-dashboard-user-menu">
            <div className="patient-dashboard-user-info">
              <span className="patient-dashboard-user-name">
                {user.first_name } {user.last_name }
              </span>
              <span className="patient-dashboard-user-role">Patient</span>
            </div>
            <button className="patient-dashboard-logout-btn" onClick={handleLogout}>
              <LogOut className="patient-dashboard-logout-icon" />
            </button>
          </div>
        </div>
      </header>

      <div className="patient-dashboard-main">
        {/* Sidebar */}
        <aside className="patient-dashboard-sidebar">
          <nav className="patient-dashboard-nav">
            <button
              className={`patient-dashboard-nav-item ${activeTab === 'overview' ? 'patient-dashboard-nav-active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <Activity className="patient-dashboard-nav-icon" />
              <span>Overview</span>
            </button>
            
            <button
              className={`patient-dashboard-nav-item ${activeTab === 'appointments' ? 'patient-dashboard-nav-active' : ''}`}
              onClick={() => setActiveTab('appointments')}
            >
              <Calendar className="patient-dashboard-nav-icon" />
              <span>Appointments</span>
            </button>
            
            <button
              className={`patient-dashboard-nav-item ${activeTab === 'documents' ? 'patient-dashboard-nav-active' : ''}`}
              onClick={() => setActiveTab('documents')}
            >
              <FileText className="patient-dashboard-nav-icon" />
              <span>Documents</span>
            </button>
            
            <button
              className={`patient-dashboard-nav-item ${activeTab === 'symptoms' ? 'patient-dashboard-nav-active' : ''}`}
              onClick={() => setActiveTab('symptoms')}
            >
              <Stethoscope className="patient-dashboard-nav-icon" />
              <span>Symptom History</span>
            </button>
            
            <button
              className={`patient-dashboard-nav-item ${activeTab === 'profile' ? 'patient-dashboard-nav-active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User className="patient-dashboard-nav-icon" />
              <span>Profile</span>
            </button>
          </nav>
          
          <div className="patient-dashboard-sidebar-bottom">
            <button 
              className="patient-dashboard-chatbot-btn"
              onClick={() => navigate('/chatBot')}
            >
              <MessageCircle className="patient-dashboard-chatbot-icon" />
              <span>AI Symptom Checker</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="patient-dashboard-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="patient-dashboard-overview">
              <div className="patient-dashboard-welcome">
                <h1>Welcome back, {user.first_name || user.firstName}!</h1>
                <p>Here's your health overview for today</p>
              </div>

              <div className="patient-dashboard-stats-grid">
                <div className="patient-dashboard-stat-card">
                  <div className="patient-dashboard-stat-icon patient-dashboard-stat-appointments">
                    <Calendar />
                  </div>
                  <div className="patient-dashboard-stat-content">
                    <h3>{stats.totalAppointments || 0}</h3>
                    <p>Total Appointments</p>
                  </div>
                </div>

                <div className="patient-dashboard-stat-card">
                  <div className="patient-dashboard-stat-icon patient-dashboard-stat-documents">
                    <FileText />
                  </div>
                  <div className="patient-dashboard-stat-content">
                    <h3>{stats.totalDocuments || 0}</h3>
                    <p>Medical Documents</p>
                  </div>
                </div>

                <div className="patient-dashboard-stat-card">
                  <div className="patient-dashboard-stat-icon patient-dashboard-stat-symptoms">
                    <Activity />
                  </div>
                  <div className="patient-dashboard-stat-content">
                    <h3>{stats.totalAnalyses || 0}</h3>
                    <p>Symptom Analyses</p>
                  </div>
                </div>

                <div className="patient-dashboard-stat-card">
                  <div className="patient-dashboard-stat-icon patient-dashboard-stat-notifications">
                    <Bell />
                  </div>
                  <div className="patient-dashboard-stat-content">
                    <h3>{stats.unreadNotifications || 0}</h3>
                    <p>Unread Notifications</p>
                  </div>
                </div>
              </div>

              <div className="patient-dashboard-overview-grid">
                <div className="patient-dashboard-overview-card">
                  <h3>Recent Appointments</h3>
                  <div className="patient-dashboard-appointment-list">
                    {appointments.slice(0, 3).map(appointment => (
                      <div key={appointment.appointment_id} className="patient-dashboard-appointment-item">
                        <div className="patient-dashboard-appointment-info">
                          <h4>Dr. {appointment.doctor_name}</h4>
                          <p>{appointment.specialization}</p>
                          <span className="patient-dashboard-appointment-date">
                            {formatDate(appointment.appointment_date)} at {appointment.appointment_time}
                          </span>
                        </div>
                        {getStatusBadge(appointment.status)}
                      </div>
                    ))}
                    {appointments.length === 0 && (
                      <p className="patient-dashboard-no-data">No recent appointments</p>
                    )}
                  </div>
                </div>

                <div className="patient-dashboard-overview-card">
                  <h3>Recent Notifications</h3>
                  <div className="patient-dashboard-notification-list">
                    {notifications.slice(0, 3).map(notification => (
                      <div 
                        key={notification.notification_id} 
                        className="patient-dashboard-notification-item"
                        onClick={() => markNotificationAsRead(notification.notification_id)}
                      >
                        <div className="patient-dashboard-notification-content">
                          <h4>{notification.title}</h4>
                          <p>{notification.message}</p>
                          <span className="patient-dashboard-notification-date">
                            {formatDate(notification.created_at)}
                          </span>
                        </div>
                        {!notification.is_read && (
                          <div className="patient-dashboard-notification-unread"></div>
                        )}
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <p className="patient-dashboard-no-data">No recent notifications</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <div className="patient-dashboard-appointments">
              <div className="patient-dashboard-section-header">
                <h2>My Appointments</h2>
                <button className="patient-dashboard-primary-btn" onClick={() => navigate('/appointment-booking')}>
                  <Plus className="patient-dashboard-btn-icon" />
                  Book New Appointment
                </button>
              </div>

              <div className="patient-dashboard-appointments-grid">
                {appointments.map(appointment => (
                  <div key={appointment.appointment_id} className="patient-dashboard-appointment-card">
                    <div className="patient-dashboard-appointment-header">
                      <h3>Dr. {appointment.doctor_name}</h3>
                      {getStatusBadge(appointment.status)}
                    </div>
                    <div className="patient-dashboard-appointment-details">
                      <p className="patient-dashboard-specialization">{appointment.specialization}</p>
                      <div className="patient-dashboard-appointment-time">
                        <Calendar className="patient-dashboard-detail-icon" />
                        <span>{formatDate(appointment.appointment_date)}</span>
                      </div>
                      <div className="patient-dashboard-appointment-time">
                        <Clock className="patient-dashboard-detail-icon" />
                        <span>{appointment.appointment_time}</span>
                      </div>
                      {appointment.reason_for_visit && (
                        <p className="patient-dashboard-appointment-reason">{appointment.reason_for_visit}</p>
                      )}
                      {appointment.consultation_fee && (
                        <p className="patient-dashboard-appointment-fee">Fee: ₹{appointment.consultation_fee}</p>
                      )}
                    </div>
                    <div className="patient-dashboard-appointment-actions">
                      {canRescheduleAppointment(appointment.status) && (
                        <button 
                          className="patient-dashboard-secondary-btn"
                          onClick={() => handleRescheduleAppointment(appointment.appointment_id, appointment)}
                        >
                          Reschedule
                        </button>
                      )}
                      {canCancelAppointment(appointment.status) && (
                        <button 
                          className="patient-dashboard-danger-btn"
                          onClick={() => handleCancelAppointment(appointment.appointment_id, appointment)}
                        >
                          Cancel
                        </button>
                      )}
                      {appointment.status === 'completed' && (
                        <button className="patient-dashboard-primary-btn">
                          View Report
                        </button>
                      )}
                      {appointment.status === 'cancelled' && (
                        <span className="patient-dashboard-cancelled-text">
                          Cancelled: {appointment.cancellation_reason || 'No reason provided'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {appointments.length === 0 && (
                  <div className="patient-dashboard-no-data-card">
                    <p>No appointments found</p>
                  </div>
                )}
              </div>

              {appointmentsPagination && appointmentsPagination.totalPages > 1 && (
                <div className="patient-dashboard-pagination">
                  <button 
                    disabled={!appointmentsPagination.hasPrevious}
                    onClick={() => loadAppointments(appointmentsPagination.currentPage - 1)}
                  >
                    Previous
                  </button>
                  <span>
                    Page {appointmentsPagination.currentPage} of {appointmentsPagination.totalPages}
                  </span>
                  <button 
                    disabled={!appointmentsPagination.hasNext}
                    onClick={() => loadAppointments(appointmentsPagination.currentPage + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="patient-dashboard-documents">
              <div className="patient-dashboard-section-header">
                <h2>Medical Documents</h2>
                <button 
                  className="patient-dashboard-primary-btn"
                  onClick={() => setUploadModal(true)}
                >
                  <Upload className="patient-dashboard-btn-icon" />
                  Upload Documents
                </button>
              </div>

              <div className="patient-dashboard-documents-filter">
                <div className="patient-dashboard-search-box">
                  <Search className="patient-dashboard-search-icon" />
                  <input 
                    type="text" 
                    placeholder="Search documents..."
                    className="patient-dashboard-search-input"
                    value={documentFilters.search}
                    onChange={handleDocumentSearch}
                  />
                </div>
                <select 
                  className="patient-dashboard-filter-select"
                  value={documentFilters.category}
                  onChange={handleCategoryFilter}
                >
                  <option value="">All Categories</option>
                  <option value="report">Reports</option>
                  <option value="prescription">Prescriptions</option>
                  <option value="image">Images</option>
                  <option value="document">Documents</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="patient-dashboard-documents-grid">
                {documents.map(document => (
                  <div key={document.file_id} className="patient-dashboard-document-card">
                    <div className="patient-dashboard-document-preview">
                      {getFileIcon(document.file_type)}
                    </div>
                    <div className="patient-dashboard-document-info">
                      <h4 className="patient-dashboard-document-name" title={document.file_name}>
                        {document.file_name}
                      </h4>
                      <p className="patient-dashboard-document-category">
                        {document.category?.charAt(0).toUpperCase() + document.category?.slice(1)}
                      </p>
                      <p className="patient-dashboard-document-date">
                        {formatDate(document.created_at)}
                      </p>
                      <p className="patient-dashboard-document-uploaded-by">
                        By: {document.uploaded_by}
                      </p>
                    </div>
                    <div className="patient-dashboard-document-actions">
                      <button 
                        className="patient-dashboard-action-btn"
                        onClick={() => {
                          setSelectedDocument(document);
                          setDocumentViewModal(true);
                        }}
                      >
                        <Eye className="patient-dashboard-action-icon" />
                      </button>
                      <button 
                        className="patient-dashboard-action-btn"
                        onClick={() => {
                          const downloadUrl = getProperDownloadUrl(document);
                          const link = window.document.createElement('a'); // Use window.document explicitly
                          link.href = downloadUrl;
                          link.download = document.file_name;
                          link.target = '_blank';
                          link.rel = 'noopener noreferrer';
                          window.document.body.appendChild(link);
                          link.click();
                          window.document.body.removeChild(link);
                        }}
                      >
                        <Download className="patient-dashboard-action-icon" />
                      </button>
                      {document.uploaded_by_patient && (
                        <button 
                          className="patient-dashboard-action-btn patient-dashboard-danger-action"
                          onClick={() => handleDocumentDelete(document.file_id)}
                        >
                          <Trash2 className="patient-dashboard-action-icon" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {documents.length === 0 && (
                  <div className="patient-dashboard-no-data-card">
                    <p>No documents found</p>
                  </div>
                )}
              </div>

              {documentsPagination && documentsPagination.totalPages > 1 && (
                <div className="patient-dashboard-pagination">
                  <button 
                    disabled={!documentsPagination.hasPrevious}
                    onClick={() => loadDocuments(documentsPagination.currentPage - 1)}
                  >
                    Previous
                  </button>
                  <span>
                    Page {documentsPagination.currentPage} of {documentsPagination.totalPages}
                  </span>
                  <button 
                    disabled={!documentsPagination.hasNext}
                    onClick={() => loadDocuments(documentsPagination.currentPage + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Symptom History Tab */}
          {activeTab === 'symptoms' && (
            <div className="patient-dashboard-symptoms">
              <div className="patient-dashboard-section-header">
                <h2>Symptom Analysis History</h2>
                <button 
                  className="patient-dashboard-primary-btn"
                  onClick={() => navigate('/chatBot')}
                >
                  <MessageCircle className="patient-dashboard-btn-icon" />
                  New Analysis
                </button>
              </div>

              <div className="patient-dashboard-symptoms-list">
                {symptomHistory.map(entry => (
                  <div key={entry.analysis_id} className="patient-dashboard-symptom-card">
                    <div className="patient-dashboard-symptom-header">
                      <h3>{entry.conversation_title || 'Symptom Analysis'}</h3>
                      <span className="patient-dashboard-symptom-date">
                        {formatDateTime(entry.created_at)}
                      </span>
                    </div>
                    <div className="patient-dashboard-symptom-content">
                      <p><strong>Symptoms:</strong> {entry.symptoms}</p>
                      {entry.severity && (
                        <div className="patient-dashboard-severity">
                          <span>Severity: </span>
                          <div className="patient-dashboard-severity-bar">
                            <div 
                              className="patient-dashboard-severity-fill"
                              style={{ width: `${(entry.severity / 10) * 100}%` }}
                            ></div>
                          </div>
                          <span>{entry.severity}/10</span>
                        </div>
                      )}
                      {entry.duration && (
                        <p><strong>Duration:</strong> {entry.duration}</p>
                      )}
                      {entry.analysis_results?.suggestion && (
                        <p><strong>AI Suggestion:</strong> {entry.analysis_results.suggestion}</p>
                      )}
                      {entry.ai_model_used && (
                        <p className="patient-dashboard-model-info">
                          <small>Analyzed by: {entry.ai_model_used}</small>
                        </p>
                      )}
                    </div>
                    <div className="patient-dashboard-symptom-actions">
                      <button className="patient-dashboard-secondary-btn">View Full Analysis</button>
                      <button className="patient-dashboard-primary-btn">Book Appointment</button>
                    </div>
                  </div>
                ))}
                {symptomHistory.length === 0 && (
                  <div className="patient-dashboard-no-data-card">
                    <p>No symptom analyses found</p>
                    <button 
                      className="patient-dashboard-primary-btn"
                      onClick={() => navigate('/chatBot')}
                    >
                      Start Your First Analysis
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="patient-dashboard-profile">
              <div className="patient-dashboard-section-header">
                <h2>My Profile</h2>
                <button className="patient-dashboard-primary-btn">
                  <Settings className="patient-dashboard-btn-icon" />
                  Edit Profile
                </button>
              </div>

              <div className="patient-dashboard-profile-grid">
                <div className="patient-dashboard-profile-card">
                  <h3>Personal Information</h3>
                  <div className="patient-dashboard-profile-fields">
                    <div className="patient-dashboard-profile-field">
                      <User className="patient-dashboard-field-icon" />
                      <div>
                        <label>Full Name</label>
                        <p>{user.first_name || user.firstName} {user.last_name || user.lastName}</p>
                      </div>
                    </div>
                    <div className="patient-dashboard-profile-field">
                      <Mail className="patient-dashboard-field-icon" />
                      <div>
                        <label>Email</label>
                        <p>{user.email}</p>
                      </div>
                    </div>
                    <div className="patient-dashboard-profile-field">
                      <Phone className="patient-dashboard-field-icon" />
                      <div>
                        <label>Phone</label>
                        <p>{user.phone || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="patient-dashboard-profile-field">
                      <Calendar className="patient-dashboard-field-icon" />
                      <div>
                        <label>Date of Birth</label>
                        <p>{user.date_of_birth ? formatDate(user.date_of_birth) : 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="patient-dashboard-profile-field">
                      <User className="patient-dashboard-field-icon" />
                      <div>
                        <label>Gender</label>
                        <p>{user.gender || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="patient-dashboard-profile-field">
                      <MapPin className="patient-dashboard-field-icon" />
                      <div>
                        <label>Address</label>
                        <p>{user.address || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="patient-dashboard-profile-card">
                  <h3>Medical Information</h3>
                  <div className="patient-dashboard-profile-fields">
                    <div className="patient-dashboard-profile-field">
                      <Heart className="patient-dashboard-field-icon" />
                      <div>
                        <label>Blood Group</label>
                        <p>{user.blood_group || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="patient-dashboard-profile-field">
                      <AlertCircle className="patient-dashboard-field-icon" />
                      <div>
                        <label>Allergies</label>
                        <p>{user.allergies || 'None reported'}</p>
                      </div>
                    </div>
                    <div className="patient-dashboard-profile-field">
                      <FileText className="patient-dashboard-field-icon" />
                      <div>
                        <label>Medical History</label>
                        <p>{user.medical_history || 'No significant medical history'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="patient-dashboard-profile-card">
                  <h3>Emergency Contact</h3>
                  <div className="patient-dashboard-profile-fields">
                    <div className="patient-dashboard-profile-field">
                      <User className="patient-dashboard-field-icon" />
                      <div>
                        <label>Contact Name</label>
                        <p>{user.emergency_contact_name || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="patient-dashboard-profile-field">
                      <Phone className="patient-dashboard-field-icon" />
                      <div>
                        <label>Contact Phone</label>
                        <p>{user.emergency_contact_phone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="patient-dashboard-notifications">
              <div className="patient-dashboard-section-header">
                <h2>Notifications</h2>
                <button 
                  className="patient-dashboard-secondary-btn"
                  onClick={async () => {
                    try {
                      const response = await fetch(`${API_BASE_URL}/patient/notifications/read-all`, {
                        method: 'PATCH',
                        headers: getAuthHeaders()
                      });
                      if (response.ok) {
                        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                      }
                    } catch (error) {
                      console.error('Error marking all as read:', error);
                    }
                  }}
                >
                  Mark All as Read
                </button>
              </div>

              <div className="patient-dashboard-notifications-list">
                {notifications.map(notification => (
                  <div 
                    key={notification.notification_id} 
                    className={`patient-dashboard-notification-card ${!notification.is_read ? 'unread' : ''}`}
                    onClick={() => markNotificationAsRead(notification.notification_id)}
                  >
                    <div className="patient-dashboard-notification-header">
                      <h3>{notification.title}</h3>
                      <span className="patient-dashboard-notification-time">
                        {formatDateTime(notification.created_at)}
                      </span>
                    </div>
                    <p className="patient-dashboard-notification-message">
                      {notification.message}
                    </p>
                    <div className="patient-dashboard-notification-meta">
                      <span className={`patient-dashboard-notification-type type-${notification.type}`}>
                        {notification.type.replace('_', ' ')}
                      </span>
                      {!notification.is_read && (
                        <div className="patient-dashboard-notification-unread-indicator"></div>
                      )}
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="patient-dashboard-no-data-card">
                    <Bell className="patient-dashboard-empty-icon" />
                    <p>No notifications yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Upload Modal */}
      {uploadModal && (
        <div className="patient-dashboard-modal-overlay">
          <div className="patient-dashboard-modal">
            <div className="patient-dashboard-modal-header">
              <h3>Upload Medical Documents</h3>
              <button 
                className="patient-dashboard-modal-close"
                onClick={() => setUploadModal(false)}
              >
                <X />
              </button>
            </div>
            
            <div className="patient-dashboard-modal-content">
              <div className="patient-dashboard-upload-section">
                <label className="patient-dashboard-file-upload-area">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileSelect}
                    className="patient-dashboard-file-input"
                  />
                  <div className="patient-dashboard-upload-content">
                    <Upload className="patient-dashboard-upload-icon" />
                    <p>Click to select files or drag and drop</p>
                    <small>PDF, JPG, PNG, DOC, DOCX files up to 10MB each</small>
                  </div>
                </label>

                <div className="patient-dashboard-form-group">
                  <label>Document Category</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="patient-dashboard-select"
                  >
                    <option value="report">Medical Report</option>
                    <option value="prescription">Prescription</option>
                    <option value="image">Medical Image</option>
                    <option value="document">Other Document</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="patient-dashboard-selected-files">
                    <h4>Selected Files:</h4>
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="patient-dashboard-selected-file">
                        <span>{file.name}</span>
                        <span>{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="patient-dashboard-modal-actions">
              <button 
                className="patient-dashboard-secondary-btn"
                onClick={() => setUploadModal(false)}
              >
                Cancel
              </button>
              <button 
                className="patient-dashboard-primary-btn"
                onClick={handleDocumentUpload}
                disabled={selectedFiles.length === 0 || loading}
              >
                {loading ? (
                  <>
                    <div className="patient-dashboard-spinner"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="patient-dashboard-btn-icon" />
                    Upload Documents
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document View Modal */}
     {documentViewModal && selectedDocument && (
      <div className="patient-dashboard-modal-overlay">
        <div className="patient-dashboard-modal patient-dashboard-document-modal">
          <div className="patient-dashboard-modal-header">
            <h3>{selectedDocument.file_name}</h3>
            <button 
              className="patient-dashboard-modal-close"
              onClick={() => setDocumentViewModal(false)}
            >
              <X />
            </button>
          </div>
          
          <div className="patient-dashboard-modal-content">
            <div className="patient-dashboard-document-preview-large">
              {getFileIcon(selectedDocument.file_type)}
              <div className="patient-dashboard-document-details">
                <p><strong>Category:</strong> {selectedDocument.category}</p>
                <p><strong>Uploaded by:</strong> {selectedDocument.uploaded_by}</p>
                <p><strong>Upload Date:</strong> {formatDateTime(selectedDocument.created_at)}</p>
                <p><strong>File Type:</strong> {selectedDocument.file_type}</p>
                {selectedDocument.appointment_id && (
                  <p><strong>Related Appointment:</strong> #{selectedDocument.appointment_id}</p>
                )}
              </div>
              
              {/* Image Preview */}
              {selectedDocument.file_type?.includes('image') && (
                <div className="patient-dashboard-image-preview">
                  <img 
                    src={selectedDocument.cloudinary_url} 
                    alt={selectedDocument.file_name}
                    style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                  />
                </div>
              )}
              
              {/* PDF Preview */}
              {selectedDocument.file_type === 'application/pdf' && (
                <div className="patient-dashboard-pdf-preview">
                  <iframe
                    src={`${selectedDocument.cloudinary_url}#toolbar=1&navpanes=1&scrollbar=1`}
                    width="100%"
                    height="500px"
                    title={selectedDocument.file_name}
                    style={{ border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                  <p style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                    <small>
                      If PDF doesn't load properly, {' '}
                      <a 
                        href={getProperDownloadUrl(selectedDocument)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#007bff', textDecoration: 'underline' }}
                      >
                        click here to download
                      </a>
                    </small>
                  </p>
                </div>
              )}
              
              {/* Other file types */}
              {!selectedDocument.file_type?.includes('image') && 
              selectedDocument.file_type !== 'application/pdf' && (
                <div className="patient-dashboard-file-preview">
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    {getFileIcon(selectedDocument.file_type)}
                    <p style={{ marginTop: '20px' }}>
                      This file type cannot be previewed. Please download to view.
                    </p>
                    <button 
                      className="patient-dashboard-primary-btn"
                      onClick={() => {
                        const downloadUrl = getProperDownloadUrl(selectedDocument);
                        const link = document.createElement('a');
                        link.href = downloadUrl;
                        link.download = selectedDocument.file_name;
                        link.target = '_blank';
                        link.rel = 'noopener noreferrer';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      style={{ marginTop: '10px' }}
                    >
                      <Download className="patient-dashboard-btn-icon" />
                      Download File
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="patient-dashboard-modal-actions">
            <button 
              className="patient-dashboard-secondary-btn"
              onClick={() => {
                const downloadUrl = getProperDownloadUrl(selectedDocument);
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = selectedDocument.file_name;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              <Download className="patient-dashboard-btn-icon" />
              Download
            </button>
            <button className="patient-dashboard-primary-btn">
              Share with Doctor
            </button>
          </div>
        </div>
      </div>
    )}

    {rescheduleModal && (
  <div className="patient-dashboard-modal-overlay">
    <div className="patient-dashboard-modal reschedule-modal">
      <div className="patient-dashboard-modal-header">
        <h3>Reschedule Appointment</h3>
        <button 
          className="patient-dashboard-modal-close"
          onClick={() => {
            setRescheduleModal(false);
            setRescheduleForm({ date: '', time: '', reason: '' });
          }}
        >
          <X />
        </button>
      </div>
      
      <div className="patient-dashboard-modal-content">
        {selectedAppointment && (
          <div className="appointment-details">
            <h4>Current Appointment</h4>
            <p><strong>Doctor:</strong> Dr. {selectedAppointment.doctor_name}</p>
            <p><strong>Date:</strong> {formatDate(selectedAppointment.appointment_date)}</p>
            <p><strong>Time:</strong> {selectedAppointment.appointment_time}</p>
          </div>
        )}
        
        <div className="reschedule-form">
          <h4>New Appointment Details</h4>
          
          <div className="patient-dashboard-form-group">
            <label>New Date</label>
            <input
              type="date"
              className="patient-dashboard-input"
              value={rescheduleForm.date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setRescheduleForm(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div className="patient-dashboard-form-group">
            <label>New Time</label>
            <input
              type="time"
              className="patient-dashboard-input"
              value={rescheduleForm.time}
              onChange={(e) => setRescheduleForm(prev => ({ ...prev, time: e.target.value }))}
              required
            />
          </div>

          <div className="patient-dashboard-form-group">
            <label>Reason for Rescheduling (Optional)</label>
            <textarea
              className="patient-dashboard-textarea"
              placeholder="Please provide a reason for rescheduling..."
              value={rescheduleForm.reason}
              onChange={(e) => setRescheduleForm(prev => ({ ...prev, reason: e.target.value }))}
              rows="3"
            />
          </div>
        </div>
      </div>

      <div className="patient-dashboard-modal-actions">
        <button 
          className="patient-dashboard-secondary-btn"
          onClick={() => {
            setRescheduleModal(false);
            setRescheduleForm({ date: '', time: '', reason: '' });
          }}
        >
          Cancel
        </button>
        <button 
          className="patient-dashboard-primary-btn"
          onClick={submitReschedule}
          disabled={!rescheduleForm.date || !rescheduleForm.time}
        >
          <Calendar className="patient-dashboard-btn-icon" />
          Reschedule Appointment
        </button>
      </div>
    </div>
  </div>
)}

{/* Cancel Modal */}
{cancelModal && (
  <div className="patient-dashboard-modal-overlay">
    <div className="patient-dashboard-modal cancel-modal">
      <div className="patient-dashboard-modal-header">
        <h3>Cancel Appointment</h3>
        <button 
          className="patient-dashboard-modal-close"
          onClick={() => {
            setCancelModal(false);
            setCancelReason('');
          }}
        >
          <X />
        </button>
      </div>
      
      <div className="patient-dashboard-modal-content">
        {selectedAppointment && (
          <div className="appointment-details">
            <h4>Appointment to Cancel</h4>
            <p><strong>Doctor:</strong> Dr. {selectedAppointment.doctor_name}</p>
            <p><strong>Date:</strong> {formatDate(selectedAppointment.appointment_date)}</p>
            <p><strong>Time:</strong> {selectedAppointment.appointment_time}</p>
            <p><strong>Specialization:</strong> {selectedAppointment.specialization}</p>
          </div>
        )}
        
        <div className="cancel-warning">
          <AlertCircle className="warning-icon" />
          <p>Are you sure you want to cancel this appointment? This action cannot be undone.</p>
        </div>

        <div className="patient-dashboard-form-group">
          <label>Reason for Cancellation (Optional)</label>
          <textarea
            className="patient-dashboard-textarea"
            placeholder="Please provide a reason for cancelling..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows="3"
          />
        </div>
      </div>

      <div className="patient-dashboard-modal-actions">
        <button 
          className="patient-dashboard-secondary-btn"
          onClick={() => {
            setCancelModal(false);
            setCancelReason('');
          }}
        >
          Keep Appointment
        </button>
        <button 
          className="patient-dashboard-danger-btn"
          onClick={submitCancellation}
        >
          <X className="patient-dashboard-btn-icon" />
          Cancel Appointment
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default PatientDashboard;