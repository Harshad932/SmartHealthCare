import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import "../../assets/styles/patient/AppointmentBooking.css";
import { 
  Search, Filter, Calendar, Clock, MapPin,  User, Phone, ChevronLeft, ChevronRight,  Stethoscope, Award, DollarSign, 
  BookOpen, CheckCircle,AlertCircle, X, } from 'lucide-react';

const AppointmentBooking = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1); // 1: Doctor Selection, 2: Time Selection, 3: Booking Details, 4: Confirmation
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [specializations, setSpecializations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingDetails, setBookingDetails] = useState({
    reasonForVisit: '',
    additionalNotes: '',
    preferredLanguage: 'English',
    isUrgent: false
  });
  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [doctorsPagination, setDoctorsPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  const API_BASE_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

  useEffect(() => {
    loadDoctors();
    loadSpecializations();
  }, []);

  useEffect(() => {
    filterDoctors();
  }, [doctors, searchQuery, selectedSpecialization]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDoctor, selectedDate]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const loadDoctors = async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/patient/doctors?page=${page}&limit=12&status=approved`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const result = await response.json();
        setDoctors(result.data.doctors);
        setDoctorsPagination(result.data.pagination);
      } else {
        console.error('Failed to load doctors');
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSpecializations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/patient/doctors/specializations`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const result = await response.json();
        setSpecializations(result.data.specializations);
      } else {
        console.error('Failed to load specializations');
      }
    } catch (error) {
      console.error('Error loading specializations:', error);
    }
  };

  const loadAvailableSlots = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/patient/doctors/${selectedDoctor.doctor_id}/availability?date=${selectedDate}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const result = await response.json();
        setAvailableSlots(result.data.slots);
      } else {
        console.error('Failed to load available slots');
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Error loading available slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const filterDoctors = () => {
    let filtered = [...doctors];

    if (searchQuery) {
      filtered = filtered.filter(doctor => 
        `${doctor.first_name} ${doctor.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedSpecialization) {
      filtered = filtered.filter(doctor => doctor.specialization === selectedSpecialization);
    }

    setFilteredDoctors(filtered);
  };

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    setCurrentStep(2);
    setSelectedDate('');
    setSelectedSlot(null);
    setAvailableSlots([]);
  };

  const handleDateSelect = (date) => {
    const dateString = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    setSelectedDate(dateString);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleBookingDetailsChange = (field, value) => {
    setBookingDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBookAppointment = async () => {
    try {
      setLoading(true);
      const appointmentData = {
        doctorId: selectedDoctor.doctor_id,
        appointmentDate: selectedDate,
        appointmentTime: selectedSlot.time,
        reasonForVisit: bookingDetails.reasonForVisit,
        additionalNotes: bookingDetails.additionalNotes,
        preferredLanguage: bookingDetails.preferredLanguage,
        isUrgent: bookingDetails.isUrgent
      };

      const response = await fetch(`${API_BASE_URL}/patient/appointments/book`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(appointmentData)
      });

      if (response.ok) {
        const result = await response.json();
        setBookingId(result.data.appointmentId);
        setBookingSuccess(true);
        setCurrentStep(4);
      } else {
        const error = await response.json();
        alert(`Booking failed: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateCalendarDays = () => {
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startOfMonth.getDay());
    
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      // Fix: Use local date string without timezone conversion
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      
      const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
      const isPast = date < today;
      const isSelected = selectedDate === dateString;
      
      days.push({
        date: date,
        dateString: dateString, // Use the manually created dateString
        day: date.getDate(),
        isCurrentMonth,
        isPast,
        isSelected,
        isDisabled: isPast || !isCurrentMonth
      });
    }

    return days;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatTime = (timeString) => {
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderStepIndicator = () => (
    <div className="patient-booking-step-indicator">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="patient-booking-step-item">
          <div className={`patient-booking-step-circle ${currentStep >= step ? 'patient-booking-step-active' : ''}`}>
            {step}
          </div>
          <span className="patient-booking-step-label">
            {step === 1 && 'Select Doctor'}
            {step === 2 && 'Choose Time'}
            {step === 3 && 'Booking Details'}
            {step === 4 && 'Confirmation'}
          </span>
          {step < 4 && <div className="patient-booking-step-connector"></div>}
        </div>
      ))}
    </div>
  );

  const renderDoctorSelection = () => (
    <div className="patient-booking-doctor-selection">
      <div className="patient-booking-section-header">
        <h2 className="patient-booking-section-title">Select a Doctor</h2>
        <p className="patient-booking-section-subtitle">Choose from our qualified healthcare professionals</p>
      </div>

      <div className="patient-booking-filters">
        <div className="patient-booking-search-container">
          <Search className="patient-booking-search-icon" />
          <input
            type="text"
            placeholder="Search doctors by name or specialization..."
            className="patient-booking-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="patient-booking-filter-container">
          <Filter className="patient-booking-filter-icon" />
          <select
            className="patient-booking-filter-select"
            value={selectedSpecialization}
            onChange={(e) => setSelectedSpecialization(e.target.value)}
          >
            <option value="">All Specializations</option>
            {specializations.map((spec, index) => (
              <option key={index} value={spec}>{spec}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="patient-booking-doctors-grid">
        {filteredDoctors.map((doctor) => (
          <div key={doctor.doctor_id} className="patient-booking-doctor-card">
            <div className="patient-booking-doctor-header">
              <div className="patient-booking-doctor-avatar">
                <User className="patient-booking-avatar-icon" />
              </div>
              <div className="patient-booking-doctor-info">
                <h3 className="patient-booking-doctor-name">
                  Dr. {doctor.first_name} {doctor.last_name}
                </h3>
                <p className="patient-booking-doctor-specialization">
                  <Stethoscope className="patient-booking-specialization-icon" />
                  {doctor.specialization}
                </p>
              </div>
              <div className="patient-booking-doctor-status">
                <span className={`patient-booking-status-badge ${doctor.availability_status}`}>
                  {doctor.availability_status}
                </span>
              </div>
            </div>

            <div className="patient-booking-doctor-details">
              {doctor.qualification && (
                <div className="patient-booking-detail-item">
                  <Award className="patient-booking-detail-icon" />
                  <span>{doctor.qualification}</span>
                </div>
              )}
              
              {doctor.experience_years && (
                <div className="patient-booking-detail-item">
                  <BookOpen className="patient-booking-detail-icon" />
                  <span>{doctor.experience_years} years experience</span>
                </div>
              )}

              {doctor.consultation_fee && (
                <div className="patient-booking-detail-item">
                  <DollarSign className="patient-booking-detail-icon" />
                  <span>{formatCurrency(doctor.consultation_fee)} consultation fee</span>
                </div>
              )}

              {doctor.clinic_address && (
                <div className="patient-booking-detail-item">
                  <MapPin className="patient-booking-detail-icon" />
                  <span>{doctor.clinic_address}</span>
                </div>
              )}

              {doctor.phone && (
                <div className="patient-booking-detail-item">
                  <Phone className="patient-booking-detail-icon" />
                  <span>{doctor.phone}</span>
                </div>
              )}
            </div>

            {doctor.bio && (
              <div className="patient-booking-doctor-bio">
                <p>{doctor.bio}</p>
              </div>
            )}

            <div className="patient-booking-doctor-actions">
              <button
                className="patient-booking-select-doctor-btn"
                onClick={() => handleDoctorSelect(doctor)}
                disabled={doctor.availability_status !== 'available'}
              >
                Select Doctor
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredDoctors.length === 0 && !loading && (
        <div className="patient-booking-no-results">
          <AlertCircle className="patient-booking-no-results-icon" />
          <h3>No doctors found</h3>
          <p>Try adjusting your search criteria or filters</p>
        </div>
      )}

      {doctorsPagination.totalPages > 1 && (
        <div className="patient-booking-pagination">
          <button
            className="patient-booking-pagination-btn"
            onClick={() => loadDoctors(currentPage - 1)}
            disabled={!doctorsPagination.hasPrevious}
          >
            <ChevronLeft className="patient-booking-pagination-icon" />
            Previous
          </button>
          
          <span className="patient-booking-pagination-info">
            Page {doctorsPagination.currentPage} of {doctorsPagination.totalPages}
          </span>
          
          <button
            className="patient-booking-pagination-btn"
            onClick={() => loadDoctors(currentPage + 1)}
            disabled={!doctorsPagination.hasNext}
          >
            Next
            <ChevronRight className="patient-booking-pagination-icon" />
          </button>
        </div>
      )}
    </div>
  );

  const renderTimeSelection = () => (
    <div className="patient-booking-time-selection">
      <div className="patient-booking-section-header">
        <button
          className="patient-booking-back-btn"
          onClick={() => setCurrentStep(1)}
        >
          <ChevronLeft className="patient-booking-back-icon" />
          Back to Doctors
        </button>
        <h2 className="patient-booking-section-title">Select Date & Time</h2>
        <p className="patient-booking-section-subtitle">
          Booking with Dr. {selectedDoctor?.first_name} {selectedDoctor?.last_name}
        </p>
      </div>

      <div className="patient-booking-time-container">
        <div className="patient-booking-calendar-section">
          <div className="patient-booking-calendar-header">
            <h3>Select Date</h3>
            <div className="patient-booking-calendar-nav">
              <button
                className="patient-booking-calendar-nav-btn"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              >
                <ChevronLeft className="patient-booking-calendar-nav-icon" />
              </button>
              <span className="patient-booking-calendar-month">
                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
              <button
                className="patient-booking-calendar-nav-btn"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              >
                <ChevronRight className="patient-booking-calendar-nav-icon" />
              </button>
            </div>
          </div>

          <div className="patient-booking-calendar">
            <div className="patient-booking-calendar-weekdays">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="patient-booking-calendar-weekday">{day}</div>
              ))}
            </div>
            <div className="patient-booking-calendar-days">
              {generateCalendarDays().map((day, index) => (
                <button
                  key={index}
                  className={`patient-booking-calendar-day ${
                    day.isSelected ? 'patient-booking-calendar-day-selected' : ''
                  } ${
                    day.isDisabled ? 'patient-booking-calendar-day-disabled' : ''
                  } ${
                    !day.isCurrentMonth ? 'patient-booking-calendar-day-other-month' : ''
                  }`}
                  onClick={() => !day.isDisabled && handleDateSelect(day.dateString)}
                  disabled={day.isDisabled}
                >
                  {day.day}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="patient-booking-slots-section">
          <h3>Available Time Slots</h3>
          {selectedDate ? (
            <div className="patient-booking-slots-container">
              {loading ? (
                <div className="patient-booking-slots-loading">
                  <div className="patient-booking-spinner"></div>
                  <p>Loading available slots...</p>
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="patient-booking-slots-grid">
                  {availableSlots.map((slot, index) => (
                    <button
                      key={index}
                      className={`patient-booking-slot-btn ${
                        selectedSlot?.time === slot.time ? 'patient-booking-slot-selected' : ''
                      } ${
                        slot.isBooked ? 'patient-booking-slot-booked' : ''
                      }`}
                      onClick={() => !slot.isBooked && handleSlotSelect(slot)}
                      disabled={slot.isBooked}
                    >
                      <Clock className="patient-booking-slot-icon" />
                      {formatTime(slot.time)}
                      {slot.isBooked && <span className="patient-booking-slot-status">Booked</span>}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="patient-booking-no-slots">
                  <Clock className="patient-booking-no-slots-icon" />
                  <p>No available slots for this date</p>
                  <p>Please select another date</p>
                </div>
              )}
            </div>
          ) : (
            <div className="patient-booking-select-date-prompt">
              <Calendar className="patient-booking-select-date-icon" />
              <p>Please select a date to see available time slots</p>
            </div>
          )}

          {selectedSlot && (
            <div className="patient-booking-time-summary">
              <h4>Selected Appointment Time</h4>
              <div className="patient-booking-selected-time">
                <Calendar className="patient-booking-summary-icon" />
                <span>{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                <Clock className="patient-booking-summary-icon" />
                <span>{formatTime(selectedSlot.time)}</span>
              </div>
              <button
                className="patient-booking-continue-btn"
                onClick={() => setCurrentStep(3)}
              >
                Continue to Booking Details
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderBookingDetails = () => (
    <div className="patient-booking-details">
      <div className="patient-booking-section-header">
        <button
          className="patient-booking-back-btn"
          onClick={() => setCurrentStep(2)}
        >
          <ChevronLeft className="patient-booking-back-icon" />
          Back to Time Selection
        </button>
        <h2 className="patient-booking-section-title">Booking Details</h2>
        <p className="patient-booking-section-subtitle">Provide additional information for your appointment</p>
      </div>

      <div className="patient-booking-details-container">
        <div className="patient-booking-appointment-summary">
          <h3>Appointment Summary</h3>
          <div className="patient-booking-summary-card">
            <div className="patient-booking-summary-item">
              <User className="patient-booking-summary-icon" />
              <div>
                <strong>Doctor:</strong> Dr. {selectedDoctor?.first_name} {selectedDoctor?.last_name}
                <br />
                <span>{selectedDoctor?.specialization}</span>
              </div>
            </div>
            <div className="patient-booking-summary-item">
              <Calendar className="patient-booking-summary-icon" />
              <div>
                <strong>Date:</strong> {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
            <div className="patient-booking-summary-item">
              <Clock className="patient-booking-summary-icon" />
              <div>
                <strong>Time:</strong> {formatTime(selectedSlot?.time)}
              </div>
            </div>
            {selectedDoctor?.consultation_fee && (
              <div className="patient-booking-summary-item">
                <DollarSign className="patient-booking-summary-icon" />
                <div>
                  <strong>Consultation Fee:</strong> {formatCurrency(selectedDoctor.consultation_fee)}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="patient-booking-details-form">
          <h3>Additional Information</h3>
          <div className="patient-booking-form-container">
            <div className="patient-booking-form-group">
              <label className="patient-booking-form-label">
                Reason for Visit <span className="patient-booking-required">*</span>
              </label>
              <textarea
                className="patient-booking-form-textarea"
                rows="4"
                placeholder="Please describe your symptoms or reason for consultation..."
                value={bookingDetails.reasonForVisit}
                onChange={(e) => handleBookingDetailsChange('reasonForVisit', e.target.value)}
                required
              />
            </div>

            <div className="patient-booking-form-group">
              <label className="patient-booking-form-label">Additional Notes</label>
              <textarea
                className="patient-booking-form-textarea"
                rows="3"
                placeholder="Any additional information you'd like to share with the doctor..."
                value={bookingDetails.additionalNotes}
                onChange={(e) => handleBookingDetailsChange('additionalNotes', e.target.value)}
              />
            </div>

            <div className="patient-booking-form-group">
              <label className="patient-booking-form-label">Preferred Language</label>
              <select
                className="patient-booking-form-select"
                value={bookingDetails.preferredLanguage}
                onChange={(e) => handleBookingDetailsChange('preferredLanguage', e.target.value)}
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Marathi">Marathi</option>
                <option value="Gujarati">Gujarati</option>
                <option value="Tamil">Tamil</option>
                <option value="Telugu">Telugu</option>
                <option value="Bengali">Bengali</option>
                <option value="Kannada">Kannada</option>
                <option value="Malayalam">Malayalam</option>
              </select>
            </div>

            <div className="patient-booking-form-group">
              <label className="patient-booking-form-checkbox">
                <input
                  type="checkbox"
                  checked={bookingDetails.isUrgent}
                  onChange={(e) => handleBookingDetailsChange('isUrgent', e.target.checked)}
                />
                <span className="patient-booking-checkbox-mark"></span>
                This is an urgent consultation
              </label>
            </div>

            <div className="patient-booking-form-actions">
              <button
                className="patient-booking-book-btn"
                onClick={handleBookAppointment}
                disabled={loading || !bookingDetails.reasonForVisit.trim()}
              >
                {loading ? (
                  <>
                    <div className="patient-booking-btn-spinner"></div>
                    Booking Appointment...
                  </>
                ) : (
                  <>
                    <CheckCircle className="patient-booking-btn-icon" />
                    Book Appointment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderConfirmation = () => (
    <div className="patient-booking-confirmation">
      <div className="patient-booking-success-container">
        <div className="patient-booking-success-icon">
          <CheckCircle className="patient-booking-success-check" />
        </div>
        <h2 className="patient-booking-success-title">Appointment Booked Successfully!</h2>
        <p className="patient-booking-success-subtitle">
          Your appointment request has been sent to the doctor for confirmation.
        </p>

        <div className="patient-booking-confirmation-details">
          <h3>Appointment Details</h3>
          <div className="patient-booking-confirmation-card">
            <div className="patient-booking-confirmation-item">
              <strong>Booking ID:</strong> #{bookingId}
            </div>
            <div className="patient-booking-confirmation-item">
              <strong>Doctor:</strong> Dr. {selectedDoctor?.first_name} {selectedDoctor?.last_name}
            </div>
            <div className="patient-booking-confirmation-item">
              <strong>Specialization:</strong> {selectedDoctor?.specialization}
            </div>
            <div className="patient-booking-confirmation-item">
              <strong>Date:</strong> {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div className="patient-booking-confirmation-item">
              <strong>Time:</strong> {formatTime(selectedSlot?.time)}
            </div>
            <div className="patient-booking-confirmation-item">
              <strong>Status:</strong> <span className="patient-booking-status-pending">Pending Confirmation</span>
            </div>
          </div>
        </div>

        <div className="patient-booking-next-steps">
          <h3>What happens next?</h3>
          <div className="patient-booking-steps-list">
            <div className="patient-booking-step-item">
              <div className="patient-booking-step-number">1</div>
              <p>The doctor will review your appointment request</p>
            </div>
            <div className="patient-booking-step-item">
              <div className="patient-booking-step-number">2</div>
              <p>You'll receive a confirmation notification within 24 hours</p>
            </div>
            <div className="patient-booking-step-item">
              <div className="patient-booking-step-number">3</div>
              <p>If confirmed, you'll receive appointment details and reminders</p>
            </div>
          </div>
        </div>

        <div className="patient-booking-confirmation-actions">
          <button
            className="patient-booking-dashboard-btn"
            onClick={() => navigate('/patient-dashboard')}
          >
            Go to Dashboard
          </button>
          <button
            className="patient-booking-book-another-btn"
            onClick={() => {
              setCurrentStep(1);
              setSelectedDoctor(null);
              setSelectedDate('');
              setSelectedSlot(null);
              setBookingDetails({
                reasonForVisit: '',
                additionalNotes: '',
                preferredLanguage: 'English',
                isUrgent: false
              });
              setBookingSuccess(false);
              setBookingId(null);
            }}
          >
            Book Another Appointment
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="patient-booking-container">
      <div className="patient-booking-header">
        <div className="patient-booking-header-content">
          <button
            className="patient-booking-close-btn"
            onClick={() => navigate('/patient-dashboard')}
          >
            <X className="patient-booking-close-icon" />
          </button>
          <h1 className="patient-booking-title">Book Appointment</h1>
        </div>
        {renderStepIndicator()}
      </div>

      <div className="patient-booking-content">
        {currentStep === 1 && renderDoctorSelection()}
        {currentStep === 2 && renderTimeSelection()}
        {currentStep === 3 && renderBookingDetails()}
        {currentStep === 4 && renderConfirmation()}
      </div>

      {loading && currentStep !== 4 && (
        <div className="patient-booking-loading-overlay">
          <div className="patient-booking-loading-content">
            <div className="patient-booking-spinner"></div>
            <p>Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentBooking;