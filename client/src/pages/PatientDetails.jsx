import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { patientApi, medicationApi, vitalSignsApi, medicalReportApi } from '@/lib/api';
import * as mockData from '@/lib/mockData';
import { ArrowRight, Heart, Pill, FileText, AlertCircle, Plus } from 'lucide-react';
import { calculateNewsScore, getNewsTextColorClass, getNewsBgColorClass, getNewsBorderColorClass, getNewsRiskLabel } from '@/lib/newsScore';

export default function PatientDetails({ params }) {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('vitals');
  const [patient, setPatient] = useState(null);
  const [medications, setMedications] = useState([]);
  const [reports, setReports] = useState([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [newReport, setNewReport] = useState({ diagnosis: '', treatmentPlan: '', reportType: 1 });
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        let patientData;
        
        // 1. Fetch main patient data
        try {
          patientData = await patientApi.getPatientById(params.id);
        } catch (apiErr) {
          console.warn('API failed, falling back to mock data');
          patientData = mockData.getPatientById(params.id);
        }
        
        if (!patientData) {
          patientData = [...mockData.mockPatients].find(p => p.id === params.id || p.id === `P00${params.id}`);
        }

        // 2. Fetch latest vitals, medications, and reports
        const [vitalsResult, medsResult, reportsResult] = await Promise.allSettled([
          vitalSignsApi.getLatestVitals(params.id),
          medicationApi.getPatientMedications(params.id),
          medicalReportApi.getPatientReports(params.id)
        ]);

        if (vitalsResult.status === 'fulfilled' && vitalsResult.value) {
          const latestVitals = vitalsResult.value;
          if (Array.isArray(patientData.vitalSigns)) {
            patientData.vitalSigns = [latestVitals, ...patientData.vitalSigns];
          } else {
            patientData.lastVitals = latestVitals;
            patientData.vitalSigns = [latestVitals];
          }
        }

        if (medsResult.status === 'fulfilled') {
          setMedications(Array.isArray(medsResult.value) ? medsResult.value : []);
        }

        if (reportsResult.status === 'fulfilled') {
          setReports(Array.isArray(reportsResult.value) ? reportsResult.value : []);
        }
        
        setPatient(patientData);
        setError(null);
      } catch (err) {
        console.error('Error fetching patient:', err);
        setError('Failed to load patient data. Please try again later.');
        setPatient(null);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPatientData();
    }
  }, [params.id]);

  if (loading) {
    return React.createElement('div', { className: "min-h-screen bg-background flex items-center justify-center" },
      React.createElement('div', { className: "text-center" },
        React.createElement('div', { className: "inline-block" },
          React.createElement('div', { className: "w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" })
        ),
        React.createElement('p', { className: "text-muted-foreground mt-4" }, "Loading patient data...")
      )
    );
  }

  if (!patient) {
    return React.createElement('div', { className: "min-h-screen bg-background flex items-center justify-center" },
      React.createElement('div', { className: "text-center" },
        error && React.createElement('div', { className: "mb-4 flex items-center justify-center gap-2 text-red-600" },
          React.createElement(AlertCircle, { size: 20 }),
          React.createElement('p', { className: "text-lg" }, error)
        ),
        !error && React.createElement('p', { className: "text-lg text-muted-foreground mb-4" }, "Patient not found"),
        React.createElement('button', {
          onClick: () => setLocation('/'),
          className: "px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        }, "Back to Dashboard")
      )
    );
  }

  const normalizeStatus = (status) => {
    return String(status || '').trim().toLowerCase().replace(/\s+/g, '_');
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return 'N/A';
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const formatDateTime = (dateValue) => {
    if (!dateValue) return 'N/A';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return 'N/A';
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
  };

  const getStatusColor = (status) => {
    switch (normalizeStatus(status)) {
      case 'stable': return 'bg-status-stable';
      case 'critical': return 'bg-status-critical';
      case 'needs_care': return 'bg-status-needs-care';
      default: return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status) => {
    switch (normalizeStatus(status)) {
      case 'stable': return 'Stable';
      case 'critical': return 'Critical';
      case 'needs_care': return 'Needs Care';
      default: return String(status || 'Unknown');
    }
  };

  const patientMedications = medications.length > 0 ? medications : (patient.medications || []);
  const patientName = patient.fullName || patient.name || 'Unknown Patient';
  const patientRoom = patient.roomNumber || (patient.bedId != null ? String(patient.bedId) : 'N/A');
  // Ensure we get the most recent vitals, checking all possible field names used in API or mock
  const patientVitals = (Array.isArray(patient.vitalSigns) && patient.vitalSigns.length > 0) 
    ? patient.vitalSigns[0] 
    : (patient.lastVitals || patient.vitals || {});
  const admissionDate = formatDate(patient.admittedAt || patient.admissionDate);
  const dob = formatDate(patient.dateOfBirth);
  
  // Get the latest medical report for Care Report section
  const latestReport = reports.length > 0 ? reports[0] : null;
  const backgroundText = latestReport?.diagnosis || patient.background || patient.notes || 'No background available';
  const previousMedications = patient.previousMedications || 'No previous medications available';
  const currentTreatmentText = latestReport?.treatmentPlan || patient.currentTreatment || patient.admissionDiagnosis || 'No current treatment available';
  
  // Calculate NEWS score from vitals
  const calculatedNewsScore = calculateNewsScore(patientVitals);
  const newsScore = patient.newsScore ?? calculatedNewsScore ?? null;
  const newsTextClass = getNewsTextColorClass(newsScore);
  const newsBgClass = getNewsBgColorClass(newsScore);
  const newsRiskLabel = getNewsRiskLabel(newsScore);

  const handleUpdateReport = async (e) => {
    e.preventDefault();
    setIsSubmittingReport(true);
    try {
      await medicalReportApi.addReport({
        patientId: parseInt(params.id),
        ...newReport
      });
      // Refresh reports to update Care Report section
      const updatedReports = await medicalReportApi.getPatientReports(params.id);
      setReports(updatedReports);
      setIsReportModalOpen(false);
      setNewReport({ diagnosis: '', treatmentPlan: '', reportType: 1 });
    } catch (err) {
      console.error('Failed to update report:', err);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const openReportModal = () => {
    // Pre-fill with current values if available
    setNewReport({
      diagnosis: latestReport?.diagnosis || patient.background || '',
      treatmentPlan: latestReport?.treatmentPlan || patient.currentTreatment || '',
      reportType: 1
    });
    setIsReportModalOpen(true);
  };

  return React.createElement('div', { className: "min-h-screen bg-background" },
    React.createElement('div', { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" },
      React.createElement('button', {
        onClick: () => setLocation('/'),
        className: "flex items-center space-x-2 mb-4 hover:opacity-80 transition-opacity"
      },
        React.createElement(ArrowRight, { size: 20 }),
        React.createElement('span', null, "Back")
      ),
      React.createElement('div', { className: "flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between" },
        React.createElement('div', null,
          React.createElement('h1', { className: "text-3xl font-bold" }, patientName),
          React.createElement('p', { className: "text-muted-foreground" }, `ID: ${patient.id} | Bed: ${patientRoom}`)
        ),
        React.createElement('div', { className: "flex flex-col items-start gap-3 sm:items-end" },
          React.createElement('div', { className: `${getStatusColor(patient.status)} text-white px-4 py-2 rounded-lg font-bold` },
            getStatusLabel(patient.status)
          ),
          React.createElement('div', { className: "flex flex-col gap-2 sm:flex-row" },
            React.createElement('button', {
              onClick: () => setLocation(`/patient/${patient.id}/vitals`),
              className: "inline-flex items-center justify-center gap-2 rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-600",
            },
              React.createElement(Plus, { size: 16 }),
              React.createElement('span', null, "Record Vitals")
            ),
            React.createElement('button', {
              onClick: () => setLocation(`/patient/${patient.id}/isbar`),
              className: "inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600",
            },
              React.createElement('span', null, "Open ISBAR Handover")
            )
          )
        )
      ),
      React.createElement('div', { className: "bg-card rounded-lg p-6 shadow-sm mt-8 mb-8 grid grid-cols-2 md:grid-cols-4 gap-4" },
        React.createElement('div', null,
          React.createElement('p', { className: "text-muted-foreground text-sm" }, "Age"),
          React.createElement('p', { className: "text-2xl font-bold" }, patient.age)
        ),
        React.createElement('div', null,
          React.createElement('p', { className: "text-muted-foreground text-sm" }, "Date of Birth"),
          React.createElement('p', { className: "text-lg font-bold" }, dob)
        ),
        React.createElement('div', null,
          React.createElement('p', { className: "text-muted-foreground text-sm" }, "Admitted At"),
          React.createElement('p', { className: "text-lg font-bold" }, admissionDate)
        ),
        React.createElement('div', null,
          React.createElement('p', { className: "text-muted-foreground text-sm" }, "NEWS Score"),
          newsScore != null
            ? React.createElement('div', { className: "flex items-center gap-2" },
                React.createElement('span', { className: `text-2xl font-bold ${newsTextClass}` }, newsScore),
                React.createElement('span', { className: `text-xs font-medium px-2 py-0.5 rounded ${newsBgClass} text-white` }, newsRiskLabel)
              )
            : React.createElement('p', { className: "text-2xl font-bold text-muted-foreground" }, 'N/A')
        )
      ),
      React.createElement('div', { className: "bg-card rounded-lg shadow-sm overflow-hidden" },
        React.createElement('div', { className: "flex border-b border-border" },
          React.createElement('button', {
            onClick: () => setActiveTab('vitals'),
            className: `flex-1 px-6 py-4 font-medium transition-colors flex items-center justify-center space-x-2 ${activeTab === 'vitals' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-secondary'}`
          },
            React.createElement(Heart, { size: 20 }),
            React.createElement('span', null, "Vital Signs")
          ),
          React.createElement('button', {
            onClick: () => setActiveTab('care'),
            className: `flex-1 px-6 py-4 font-medium transition-colors flex items-center justify-center space-x-2 ${activeTab === 'care' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-secondary'}`
          },
            React.createElement(FileText, { size: 20 }),
            React.createElement('span', null, "Care Report")
          ),
          React.createElement('button', {
            onClick: () => setActiveTab('medication'),
            className: `flex-1 px-6 py-4 font-medium transition-colors flex items-center justify-center space-x-2 ${activeTab === 'medication' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-secondary'}`
          },
            React.createElement(Pill, { size: 20 }),
            React.createElement('span', null, "Medications")
          )
        ),
        React.createElement('div', { className: "p-6" },
          activeTab === 'vitals' && React.createElement('div', null,
            React.createElement('h3', { className: "text-xl font-bold mb-6" }, "Current Vital Signs"),
            patientVitals ? React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" },
              React.createElement('div', { className: "vital-display p-4 bg-secondary rounded-lg text-center" },
                React.createElement(Heart, { size: 24, className: "text-red-500 mb-2 mx-auto" }),
                React.createElement('div', { className: "text-2xl font-bold" }, patientVitals.heartRate ?? '—'),
                React.createElement('div', { className: "text-sm text-muted-foreground" }, "Heart Rate (bpm)")
              ),
              React.createElement('div', { className: "vital-display p-4 bg-secondary rounded-lg text-center" },
                React.createElement('div', { className: "text-2xl mb-2" }, "🌡️"),
                React.createElement('div', { className: "text-2xl font-bold" }, patientVitals.temperature != null ? `${patientVitals.temperature}°C` : '—'),
                React.createElement('div', { className: "text-sm text-muted-foreground" }, "Temperature")
              ),
              React.createElement('div', { className: "vital-display p-4 bg-secondary rounded-lg text-center" },
                React.createElement('div', { className: "text-2xl mb-2" }, "📊"),
                React.createElement('div', { className: "text-2xl font-bold" }, patientVitals.systolicPressure != null && patientVitals.diastolicPressure != null ? `${patientVitals.systolicPressure}/${patientVitals.diastolicPressure}` : (patientVitals.bloodPressure || '—')),
                React.createElement('div', { className: "text-sm text-muted-foreground" }, "Blood Pressure (mmHg)")
              ),
              React.createElement('div', { className: "vital-display p-4 bg-secondary rounded-lg text-center" },
                React.createElement('div', { className: "text-2xl mb-2" }, "💨"),
                React.createElement('div', { className: "text-2xl font-bold" }, (patientVitals.oxygenLevel || patientVitals.oxygenSaturation) != null ? `${patientVitals.oxygenLevel || patientVitals.oxygenSaturation}%` : '—'),
                React.createElement('div', { className: "text-sm text-muted-foreground" }, "Oxygen Level")
              ),
              React.createElement('div', { className: "vital-display p-4 bg-secondary rounded-lg text-center" },
                React.createElement('div', { className: "text-2xl mb-2" }, "🫁"),
                React.createElement('div', { className: "text-2xl font-bold" }, (patientVitals.respirationRate || patientVitals.respiratoryRate) ?? '—'),
                React.createElement('div', { className: "text-sm text-muted-foreground" }, "Respiration Rate")
              )
            ) : React.createElement('p', { className: "text-muted-foreground" }, "No vital signs data available")
          ),
          activeTab === 'care' && React.createElement('div', null,
            React.createElement('div', { className: "flex justify-between items-center mb-6" },
              React.createElement('h3', { className: "text-xl font-bold" }, "Care Report"),
              React.createElement('button', {
                onClick: openReportModal,
                className: "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              },
                React.createElement(Plus, { size: 16 }),
                "Update Report"
              )
            ),
            React.createElement('div', { className: "space-y-4" },
              React.createElement('div', { className: "p-4 bg-secondary rounded-lg" },
                React.createElement('p', { className: "text-muted-foreground text-sm mb-2" }, "Background / Diagnosis"),
                React.createElement('p', { className: "text-foreground" }, backgroundText)
              ),
              React.createElement('div', { className: "p-4 bg-secondary rounded-lg" },
                React.createElement('p', { className: "text-muted-foreground text-sm mb-2" }, "Current Treatment Plan"),
                React.createElement('p', { className: "text-foreground" }, currentTreatmentText)
              ),
              reports.length > 1 && React.createElement('div', { className: "mt-8" },
                React.createElement('h4', { className: "font-semibold mb-4 text-muted-foreground" }, "Previous Reports"),
                React.createElement('div', { className: "space-y-3" },
                  reports.slice(1).map(report => (
                    React.createElement('div', { key: report.id || Math.random(), className: "p-4 border border-border rounded-lg text-sm" },
                      React.createElement('p', { className: "text-xs text-muted-foreground mb-2" }, new Date(report.createdAt || Date.now()).toLocaleString()),
                      React.createElement('p', { className: "font-medium mb-1" }, "Diagnosis: ", React.createElement('span', { className: "font-normal" }, report.diagnosis)),
                      React.createElement('p', { className: "font-medium" }, "Treatment: ", React.createElement('span', { className: "font-normal" }, report.treatmentPlan))
                    )
                  ))
                )
              )
            )
          ),
          activeTab === 'medication' && React.createElement('div', null,
            React.createElement('h3', { className: "text-xl font-bold mb-6" }, "Prescribed Medications"),
            patientMedications.length > 0 ? React.createElement('div', { className: "space-y-4" },
              patientMedications.map((med) => React.createElement('div', { key: med.id, className: "p-4 border border-border rounded-lg hover:bg-secondary transition-colors" },
                React.createElement('div', { className: "flex justify-between items-start mb-3" },
                  React.createElement('div', null,
                    React.createElement('h4', { className: "font-bold text-lg" }, med.name),
                    React.createElement('p', { className: "text-sm text-muted-foreground" }, `Dosage: ${med.dosage}`)
                  ),
                  React.createElement('button', {
                    onClick: () => setLocation(`/patient/${patient.id}/medication/${med.id}`),
                    className: "px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                  }, "Administer Now")
                ),
                React.createElement('div', { className: "grid grid-cols-2 gap-2 text-sm" },
                  React.createElement('div', null,
                    React.createElement('p', { className: "text-muted-foreground" }, "Frequency"),
                    React.createElement('p', { className: "font-medium" }, med.frequency)
                  ),
                  React.createElement('div', null,
                    React.createElement('p', { className: "text-muted-foreground" }, "Route"),
                    React.createElement('p', { className: "font-medium" }, med.route)
                  )
                )
              ))
            ) : React.createElement('p', { className: "text-muted-foreground" }, "No medications prescribed")
          )
        )
      ),
      
      // Medical Report Modal
      isReportModalOpen && React.createElement('div', { className: "fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" },
        React.createElement('div', { className: "bg-background rounded-xl shadow-xl max-w-lg w-full p-6 relative" },
          React.createElement('h3', { className: "text-xl font-bold mb-4" }, "Update Medical Report"),
          React.createElement('form', { onSubmit: handleUpdateReport, className: "space-y-4" },
            React.createElement('div', null,
              React.createElement('label', { className: "block text-sm font-medium mb-1" }, "Diagnosis / Background"),
              React.createElement('textarea', {
                value: newReport.diagnosis,
                onChange: (e) => setNewReport({...newReport, diagnosis: e.target.value}),
                className: "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[100px]",
                required: true
              })
            ),
            React.createElement('div', null,
              React.createElement('label', { className: "block text-sm font-medium mb-1" }, "Treatment Plan"),
              React.createElement('textarea', {
                value: newReport.treatmentPlan,
                onChange: (e) => setNewReport({...newReport, treatmentPlan: e.target.value}),
                className: "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[100px]",
                required: true
              })
            ),
            React.createElement('div', { className: "flex justify-end gap-3 mt-6" },
              React.createElement('button', {
                type: "button",
                onClick: () => setIsReportModalOpen(false),
                className: "px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors"
              }, "Cancel"),
              React.createElement('button', {
                type: "submit",
                disabled: isSubmittingReport,
                className: "px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors disabled:opacity-50"
              }, isSubmittingReport ? "Saving..." : "Save Report")
            )
          )
        )
      )
    )
  );
}
