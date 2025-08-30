import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, Menu, X
} from 'lucide-react';
import styles from "../../assets/styles/doctor/Aura.module.css";

const VoiceConsultation = ({ appointmentId, patientInfo, onClose }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [reports, setReports] = useState(null);
  const [error, setError] = useState('');
  const [detectedLanguages, setDetectedLanguages] = useState([]);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [editingPatientReport, setEditingPatientReport] = useState(false);
  const [editedPatientReport, setEditedPatientReport] = useState(null);
  const [geminiStatus, setGeminiStatus] = useState('unknown');
  const [isLoadingConnection, setIsLoadingConnection] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');

  const recognitionRef = useRef(null);
  const durationIntervalRef = useRef(null);

  const API_BASE_URL = `${process.env.REACT_APP_BACKEND_URL}/api/doctor`;

  useEffect(() => {
    initializeSpeechRecognition();
    checkGeminiConnection();
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  const checkGeminiConnection = async () => {
    setIsLoadingConnection(true);
    try {
      const response = await fetch(`${API_BASE_URL}/test-connection`);
      const data = await response.json();
      setGeminiStatus(data.success ? 'connected' : 'disconnected');
    } catch (error) {
      console.error('Connection test failed:', error);
      setGeminiStatus('disconnected');
    } finally {
      setIsLoadingConnection(false);
    }
  };

  const initializeSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        setError('Speech recognition not supported in this browser. Please use Chrome or Edge.');
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        setIsRecording(true);
        setError('');
        startDurationTimer();
    };

    recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        
        if (result.isFinal) {
            finalTranscript += transcript;
        } else {
            interimTranscript += transcript;
        }
        }

        if (finalTranscript) {
        setTranscript(prevTranscript => prevTranscript + finalTranscript + ' ');
        }
        
        setInterimTranscript(interimTranscript);
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
        stopDurationTimer();
    };

    recognition.onend = () => {
        setIsRecording(false);
        stopDurationTimer();
    };

    recognitionRef.current = recognition;
  };

  const startDurationTimer = () => {
    setRecordingDuration(0);
    durationIntervalRef.current = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
  };

  const stopDurationTimer = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      setReports(null);
      setError('');
      recognitionRef.current?.start();
    }
  };

  const processTranscript = async () => {
    if (!transcript.trim()) {
      setError('No transcript available to process');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/process-transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: transcript.trim(),
          appointmentId: appointmentId
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to process transcript');
      }

      setReports({
        patientReport: data.patientReport,
        doctorReport: data.doctorReport
      });
      setDetectedLanguages(data.detectedLanguages || []);

    } catch (error) {
      console.error('Error processing transcript:', error);
      setError(`Failed to process transcript: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getConsultationSummary = async () => {
    if (!transcript.trim()) {
      setError('No transcript available to summarize');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: transcript.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Summary: ${data.summary.summary}\n\nKey Points:\n${data.summary.keyPoints.join('\n')}`);
      }
    } catch (error) {
      console.error('Error getting summary:', error);
      setError('Failed to get consultation summary');
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
    setReports(null);
    setError('');
    setDetectedLanguages([]);
    setRecordingDuration(0);
  };

  const startEditingPatientReport = () => {
    setEditingPatientReport(true);
    setEditedPatientReport({ ...reports.patientReport });
  };

  const saveEditedPatientReport = () => {
    setReports({
      ...reports,
      patientReport: editedPatientReport
    });
    setEditingPatientReport(false);
  };

  const updateEditedField = (field, value) => {
    setEditedPatientReport({
      ...editedPatientReport,
      [field]: value
    });
  };

  const updateEditedArrayField = (field, index, value) => {
    const updatedArray = [...editedPatientReport[field]];
    updatedArray[index] = value;
    setEditedPatientReport({
      ...editedPatientReport,
      [field]: updatedArray
    });
  };

  const addArrayItem = (field) => {
    setEditedPatientReport({
      ...editedPatientReport,
      [field]: [...editedPatientReport[field], '']
    });
  };

  const removeArrayItem = (field, index) => {
    const updatedArray = editedPatientReport[field].filter((_, i) => i !== index);
    setEditedPatientReport({
      ...editedPatientReport,
      [field]: updatedArray
    });
  };

  const exportReports = () => {
    if (!reports) return;

    const reportData = {
      appointmentId,
      patientInfo,
      detectedLanguages,
      generatedAt: new Date().toISOString(),
      patientReport: reports.patientReport,
      doctorReport: reports.doctorReport
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consultation_reports_${appointmentId}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printPatientReport = () => {
    if (!reports) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Patient Report - ${patientInfo?.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #4CAF50; }
            .section { margin: 20px 0; }
            .prescription { border: 1px solid #ddd; padding: 10px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <h1>Medical Consultation Report</h1>
          <div class="section">
            <strong>Patient:</strong> ${patientInfo?.name}<br>
            <strong>Date:</strong> ${reports.patientReport.visitDate}<br>
            <strong>Languages Detected:</strong> ${detectedLanguages.join(', ')}
          </div>
          <div class="section">
            <h3>Chief Complaint</h3>
            <p>${reports.patientReport.chiefComplaint}</p>
          </div>
          <div class="section">
            <h3>Diagnosis</h3>
            <p>${reports.patientReport.diagnosis}</p>
          </div>
          <div class="section">
            <h3>Symptoms</h3>
            <ul>${reports.patientReport.symptoms.map(s => `<li>${s}</li>`).join('')}</ul>
          </div>
          <div class="section">
            <h3>Prescriptions</h3>
            ${reports.patientReport.prescriptions.map(p => `
              <div class="prescription">
                <strong>${p.medication}</strong><br>
                Dosage: ${p.dosage}<br>
                Frequency: ${p.frequency}<br>
                Duration: ${p.duration}<br>
                Instructions: ${p.instructions}
              </div>
            `).join('')}
          </div>
          <div class="section">
            <h3>Lifestyle Recommendations</h3>
            <ul>${reports.patientReport.lifestyle.map(l => `<li>${l}</li>`).join('')}</ul>
          </div>
          <div class="section">
            <h3>Next Visit</h3>
            <p>${reports.patientReport.nextVisit}</p>
          </div>
          <div class="section">
            <h3>Emergency Instructions</h3>
            <p>${reports.patientReport.emergencyInstructions}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <div className={styles["aura-container"]}>
      {/* Header */}
      <header className={styles["aura-header"]}>
        <div className={styles["aura-nav-container"]}>
          <div className={styles["aura-nav-wrapper"]}>
            <div className={styles["aura-logo"]}>
              <div className={styles["aura-logo-icon"]}>
                <Heart className={styles["aura-logo-heart"]} />
              </div>
              <h1 className={styles["logo-text"]} onClick={() => handleNavigation('/')}>AYUMATE</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className={styles["aura-desktop-nav"]}>
              <button 
                onClick={() => handleNavigation('/dosha')}
                className={styles["aura-nav-link"]}
              >
                Prakriti Check
              </button>
              <button 
                onClick={() => handleNavigation('/chatBot')}
                className={styles["aura-nav-link"]}
              >
                AI Symptom Checker
              </button>
              <div className={styles["aura-auth-buttons"]}>
                <button 
                  onClick={() => handleNavigation('/patient-login')}
                  className={styles["aura-login-btn"]}
                >
                  Patient Login
                </button>
                <button 
                  onClick={() => handleNavigation('/doctor-login')}
                  className={styles["aura-login-btn"]}
                >
                  Doctor Login
                </button>
                <button 
                  onClick={() => handleNavigation('/admin-login')}
                  className={styles["aura-admin-btn"]}
                >
                  Admin
                </button>
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={styles["aura-mobile-menu-btn"]}
            >
              {isMenuOpen ? <X className={styles["aura-menu-icon"]} /> : <Menu className={styles["aura-menu-icon"]} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className={styles["aura-mobile-nav"]}>
            <div className={styles["aura-mobile-nav-container"]}>
              <button 
                onClick={() => handleNavigation('/dosha')}
                className={styles["aura-mobile-nav-link"]}
              >
                Prakriti Check
              </button>
              <button 
                onClick={() => handleNavigation('/chatBot')}
                className={styles["aura-mobile-nav-link"]}
              >
                AI Symptom Checker
              </button>
              <div className={styles["aura-mobile-auth"]}>
                <button 
                  onClick={() => handleNavigation('/patient-login')}
                  className={styles["aura-mobile-login"]}
                >
                  Patient Login
                </button>
                <button 
                  onClick={() => handleNavigation('/doctor-login')}
                  className={styles["aura-mobile-login"]}
                >
                  Doctor Login
                </button>
                <button 
                  onClick={() => handleNavigation('/admin-login')}
                  className={styles["aura-mobile-admin"]}
                >
                  Admin Login
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Voice Consultation Content */}
      <main className={styles["aura-main-content"]}>
        <div className={styles["aura-voice-consultation"]}>
          {/* Header Info */}
          <div className={styles["aura-consultation-header"]}>
            <div className={styles["aura-header-info"]}>
              <h1 className={styles["aura-title"]}>
                Voice Consultation - {patientInfo?.name}
              </h1>
              <p className={styles["aura-subtitle"]}>
                Real-time multilingual medical consultation recording
              </p>
              <div className={styles["aura-connection-status"]}>
                <span className={`${styles["aura-status-indicator"]} ${styles[geminiStatus]}`}>
                  {isLoadingConnection ? '⏳' : geminiStatus === 'connected' ? '✅' : '❌'}
                </span>
                <span className={styles["aura-status-text"]}>
                  AI Service: {isLoadingConnection ? 'Checking...' : geminiStatus}
                </span>
              </div>
            </div>
            <button onClick={onClose} className={styles["aura-close-btn"]}>
              Close Consultation
            </button>
          </div>

          {/* Recording Section */}
          <div className={styles["aura-recording-section"]}>
            <h2 className={styles["aura-section-title"]}>Record Consultation</h2>
            
            {/* Recording Button */}
            <div className={styles["aura-recording-controls"]}>
              <button
                onClick={toggleRecording}
                className={`${styles["aura-record-btn"]} ${isRecording ? styles["recording"] : ''}`}
                disabled={geminiStatus !== 'connected'}
              >
                {isRecording ? '⏹️' : '🎤'}
              </button>
              
              <div className={styles["aura-recording-status"]}>
                <p className={styles["aura-recording-text"]}>
                  {isRecording ? 'Recording...' : 'Click to Start Recording'}
                </p>
                {isRecording && (
                  <p className={styles["aura-recording-duration"]}>
                    {formatDuration(recordingDuration)}
                  </p>
                )}
              </div>
            </div>

            {/* Language Support Info */}
            <div className={styles["aura-language-info"]}>
              <p>🌐 Multilingual Support: English, Hindi, Marathi - Speak naturally in any language</p>
            </div>

            {/* Action Buttons */}
            <div className={styles["aura-action-buttons"]}>
              <button
                onClick={processTranscript}
                disabled={!transcript.trim() || isProcessing || isRecording}
                className={`${styles["aura-btn"]} ${styles["aura-btn-primary"]}`}
              >
                {isProcessing ? '🤖 Processing with AI...' : '📋 Generate Reports'}
              </button>
              
              <button
                onClick={getConsultationSummary}
                disabled={!transcript.trim() || isProcessing || isRecording}
                className={`${styles["aura-btn"]} ${styles["aura-btn-secondary"]}`}
              >
                📄 Quick Summary
              </button>
              
              <button
                onClick={clearTranscript}
                disabled={isRecording}
                className={`${styles["aura-btn"]} ${styles["aura-btn-warning"]}`}
              >
                🗑️ Clear
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className={styles["aura-error"]}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Live Transcript */}
          <div className={styles["aura-transcript-section"]}>
            <h3 className={styles["aura-transcript-header"]}>
              📝 Live Transcript
              {detectedLanguages.length > 0 && (
                <span className={styles["aura-language-tag"]}>
                  {detectedLanguages.join(', ')}
                </span>
              )}
            </h3>
            <div className={styles["aura-transcript-box"]}>
            {transcript || interimTranscript ? (
                <p className={styles["aura-transcript-text"]}>
                {transcript}
                {interimTranscript && (
                    <span style={{ color: '#888', fontStyle: 'italic' }}>
                    {interimTranscript}
                    </span>
                )}
                </p>
            ) : (
                <p className={styles["aura-transcript-placeholder"]}>
                {isRecording 
                    ? 'Listening... Speak in English, Hindi, or Marathi'
                    : 'Transcript will appear here when you start recording...'
                }
                </p>
            )}
            </div>
          </div>

          {/* Reports Section */}
          {reports && (
            <div className={styles["aura-reports-section"]}>
              <div className={styles["aura-reports-header"]}>
                <h2>Generated Reports</h2>
                <div className={styles["aura-report-actions"]}>
                  <button onClick={exportReports} className={`${styles["aura-btn"]} ${styles["aura-btn-success"]}`}>
                    💾 Export JSON
                  </button>
                  <button onClick={printPatientReport} className={`${styles["aura-btn"]} ${styles["aura-btn-info"]}`}>
                    🖨️ Print Patient Report
                  </button>
                </div>
              </div>

              <div className={styles["aura-reports-grid"]}>
                {/* Patient Report */}
                <div className={`${styles["aura-report-card"]} ${styles["aura-patient-report"]}`}>
                  <div className={styles["aura-report-header"]}>
                    <h3>👤 Patient Report</h3>
                    {!editingPatientReport ? (
                      <button onClick={startEditingPatientReport} className={`${styles["aura-btn"]} ${styles["aura-btn-edit"]}`}>
                        ✏️ Edit
                      </button>
                    ) : (
                      <div className={styles["aura-edit-buttons"]}>
                        <button onClick={saveEditedPatientReport} className={`${styles["aura-btn"]} ${styles["aura-btn-save"]}`}>
                          ✓ Save
                        </button>
                        <button onClick={() => setEditingPatientReport(false)} className={`${styles["aura-btn"]} ${styles["aura-btn-cancel"]}`}>
                          ✗ Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {editingPatientReport ? (
                    <div className={styles["aura-edit-form"]}>
                      <div className={styles["aura-form-group"]}>
                        <label>Chief Complaint:</label>
                        <textarea
                          value={editedPatientReport.chiefComplaint}
                          onChange={(e) => updateEditedField('chiefComplaint', e.target.value)}
                          className={styles["aura-textarea"]}
                        />
                      </div>
                      
                      <div className={styles["aura-form-group"]}>
                        <label>Diagnosis:</label>
                        <textarea
                          value={editedPatientReport.diagnosis}
                          onChange={(e) => updateEditedField('diagnosis', e.target.value)}
                          className={styles["aura-textarea"]}
                        />
                      </div>

                      <div className={styles["aura-form-group"]}>
                        <label>Symptoms:</label>
                        {editedPatientReport.symptoms.map((symptom, index) => (
                          <div key={index} className={styles["aura-array-item"]}>
                            <input
                              type="text"
                              value={symptom}
                              onChange={(e) => updateEditedArrayField('symptoms', index, e.target.value)}
                              className={styles["aura-input"]}
                            />
                            <button
                              onClick={() => removeArrayItem('symptoms', index)}
                              className={`${styles["aura-btn"]} ${styles["aura-btn-remove"]}`}
                            >
                              ✗
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addArrayItem('symptoms')}
                          className={`${styles["aura-btn"]} ${styles["aura-btn-add"]}`}
                        >
                          + Add Symptom
                        </button>
                      </div>

                      <div className={styles["aura-form-group"]}>
                        <label>Lifestyle Recommendations:</label>
                        {editedPatientReport.lifestyle.map((item, index) => (
                          <div key={index} className={styles["aura-array-item"]}>
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => updateEditedArrayField('lifestyle', index, e.target.value)}
                              className={styles["aura-input"]}
                            />
                            <button
                              onClick={() => removeArrayItem('lifestyle', index)}
                              className={`${styles["aura-btn"]} ${styles["aura-btn-remove"]}`}
                            >
                              ✗
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addArrayItem('lifestyle')}
                          className={`${styles["aura-btn"]} ${styles["aura-btn-add"]}`}
                        >
                          + Add Recommendation
                        </button>
                      </div>

                      <div className={styles["aura-form-group"]}>
                        <label>Next Visit:</label>
                        <input
                          type="text"
                          value={editedPatientReport.nextVisit}
                          onChange={(e) => updateEditedField('nextVisit', e.target.value)}
                          className={styles["aura-input"]}
                        />
                      </div>

                      <div className={styles["aura-form-group"]}>
                        <label>Emergency Instructions:</label>
                        <textarea
                          value={editedPatientReport.emergencyInstructions}
                          onChange={(e) => updateEditedField('emergencyInstructions', e.target.value)}
                          className={styles["aura-textarea"]}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className={styles["aura-report-content"]}>
                      <div className={styles["aura-report-item"]}>
                        <strong>Visit Date:</strong> {reports.patientReport.visitDate}
                      </div>
                      <div className={styles["aura-report-item"]}>
                        <strong>Chief Complaint:</strong> {reports.patientReport.chiefComplaint}
                      </div>
                      <div className={styles["aura-report-item"]}>
                        <strong>Diagnosis:</strong> {reports.patientReport.diagnosis}
                      </div>
                      <div className={styles["aura-report-item"]}>
                        <strong>Symptoms:</strong>
                        <ul>
                          {reports.patientReport.symptoms.map((symptom, index) => (
                            <li key={index}>{symptom}</li>
                          ))}
                        </ul>
                      </div>
                      {reports.patientReport.prescriptions.length > 0 && (
                        <div className={styles["aura-report-item"]}>
                          <strong>Prescriptions:</strong>
                          {reports.patientReport.prescriptions.map((prescription, index) => (
                            <div key={index} className={styles["aura-prescription"]}>
                              <div><strong>{prescription.medication}</strong></div>
                              <div>Dosage: {prescription.dosage}</div>
                              <div>Frequency: {prescription.frequency}</div>
                              <div>Duration: {prescription.duration}</div>
                              <div>Instructions: {prescription.instructions}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className={styles["aura-report-item"]}>
                        <strong>Lifestyle Recommendations:</strong>
                        <ul>
                          {reports.patientReport.lifestyle.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div className={styles["aura-report-item"]}>
                        <strong>Next Visit:</strong> {reports.patientReport.nextVisit}
                      </div>
                      <div className={styles["aura-report-item"]}>
                        <strong>Emergency Instructions:</strong> {reports.patientReport.emergencyInstructions}
                      </div>
                    </div>
                  )}
                </div>

                {/* Doctor Report */}
                <div className={`${styles["aura-report-card"]} ${styles["aura-doctor-report"]}`}>
                  <div className={styles["aura-report-header"]}>
                    <h3>🩺 Doctor Report (Internal)</h3>
                  </div>

                  <div className={styles["aura-report-content"]}>
                    <div className={styles["aura-clinical-notes"]}>
                      <h4>SOAP Notes</h4>
                      <div className={styles["aura-soap-item"]}>
                        <strong>Subjective:</strong> {reports.doctorReport.clinicalNotes.subjective}
                      </div>
                      <div className={styles["aura-soap-item"]}>
                        <strong>Objective:</strong> {reports.doctorReport.clinicalNotes.objective}
                      </div>
                      <div className={styles["aura-soap-item"]}>
                        <strong>Assessment:</strong> {reports.doctorReport.clinicalNotes.assessment}
                      </div>
                      <div className={styles["aura-soap-item"]}>
                        <strong>Plan:</strong> {reports.doctorReport.clinicalNotes.plan}
                      </div>
                    </div>

                    <div className={styles["aura-behavioral-analysis"]}>
                      <h4>Behavioral Analysis</h4>
                      <div className={styles["aura-analysis-item"]}>
                        <strong>Emotional State:</strong> {reports.doctorReport.behavioralAnalysis.emotionalState}
                      </div>
                      <div className={styles["aura-analysis-item"]}>
                        <strong>Compliance:</strong> {reports.doctorReport.behavioralAnalysis.compliance}
                      </div>
                      <div className={styles["aura-analysis-item"]}>
                        <strong>Communication:</strong> {reports.doctorReport.behavioralAnalysis.communication}
                      </div>
                      {reports.doctorReport.behavioralAnalysis.redFlags.length > 0 && (
                        <div className={`${styles["aura-analysis-item"]} ${styles["aura-red-flags"]}`}>
                          <strong>Red Flags:</strong>
                          <ul>
                            {reports.doctorReport.behavioralAnalysis.redFlags.map((flag, index) => (
                              <li key={index}>{flag}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className={styles["aura-analysis-item"]}>
                        <strong>Family Dynamics:</strong> {reports.doctorReport.behavioralAnalysis.familyDynamics}
                      </div>
                    </div>

                    {reports.doctorReport.therapyConsiderations.recommended && (
                      <div className={styles["aura-therapy-considerations"]}>
                        <h4>Therapy Considerations</h4>
                        <div className={styles["aura-therapy-item"]}>
                          <strong>Type:</strong> {reports.doctorReport.therapyConsiderations.type}
                        </div>
                        <div className={styles["aura-therapy-item"]}>
                          <strong>Frequency:</strong> {reports.doctorReport.therapyConsiderations.frequency}
                        </div>
                        <div className={styles["aura-therapy-item"]}>
                          <strong>Focus Areas:</strong>
                          <ul>
                            {reports.doctorReport.therapyConsiderations.focusAreas.map((area, index) => (
                              <li key={index}>{area}</li>
                            ))}
                          </ul>
                        </div>
                        <div className={styles["aura-therapy-item"]}>
                          <strong>Goals:</strong>
                          <ul>
                            {reports.doctorReport.therapyConsiderations.goals.map((goal, index) => (
                              <li key={index}>{goal}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    <div className={styles["aura-additional-notes"]}>
                      <div className={styles["aura-note-item"]}>
                        <strong>Risk Assessment:</strong> {reports.doctorReport.riskAssessment}
                      </div>
                      <div className={styles["aura-note-item"]}>
                        <strong>Language Notes:</strong> {reports.doctorReport.languageNotes}
                      </div>
                      <div className={styles["aura-note-item"]}>
                        <strong>Internal Notes:</strong> {reports.doctorReport.internalNotes}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className={styles["aura-footer"]}>
        <div className={styles["aura-footer-container"]}>
          <div className={styles["aura-footer-content"]}>
            <div className={styles["aura-footer-brand"]}>
              <div className={styles["aura-footer-logo"]}>
                <div className={styles["aura-logo-icon"]}>
                  <Heart className={styles["aura-footer-heart"]} />
                </div>
                <h3 className={styles["aura-footer-title"]}>AYUMATE</h3>
              </div>
              <p className={styles["aura-footer-desc"]}>
                Your comprehensive Ayurvedic health companion, combining ancient wisdom with modern technology for optimal wellness.
              </p>
            </div>

            <div className={styles["aura-footer-links"]}>
              <h4 className={styles["aura-footer-heading"]}>Quick Links</h4>
              <ul className={styles["aura-footer-list"]}>
                <li><button onClick={() => handleNavigation('/dosha')} className={styles["aura-footer-link"]}>Prakriti Assessment</button></li>
                <li><button onClick={() => handleNavigation('/chatBot')} className={styles["aura-footer-link"]}>AI Symptom Checker</button></li>
                <li><button onClick={() => handleNavigation('/patient-register')} className={styles["aura-footer-link"]}>Patient Portal</button></li>
                <li><button onClick={() => handleNavigation('/doctor-register')} className={styles["aura-footer-link"]}>Doctor Portal</button></li>
              </ul>
            </div>

            <div className={styles["aura-footer-features"]}>
              <h4 className={styles["aura-footer-heading"]}>Features</h4>
              <ul className={styles["aura-footer-list"]}>
                <li className={styles["aura-footer-item"]}>Medical Records Storage</li>
                <li className={styles["aura-footer-item"]}>Doctor Appointments</li>
                <li className={styles["aura-footer-item"]}>Smart Consultations</li>
                <li className={styles["aura-footer-item"]}>Health Analytics</li>
              </ul>
            </div>

            <div className={styles["aura-footer-contact"]}>
              <h4 className={styles["aura-footer-heading"]}>Support</h4>
              <ul className={styles["aura-footer-list"]}>
                <li className={styles["aura-footer-item"]}>24/7 Customer Support</li>
                <li className={styles["aura-footer-item"]}>Help Center</li>
                <li className={styles["aura-footer-item"]}>Privacy Policy</li>
                <li className={styles["aura-footer-item"]}>Terms of Service</li>
              </ul>
            </div>
          </div>

          <div className={styles["aura-footer-bottom"]}>
            <p className={styles["aura-copyright"]}>
              © 2025 AYUMATE. All rights reserved. Empowering health through technology and tradition.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default VoiceConsultation;