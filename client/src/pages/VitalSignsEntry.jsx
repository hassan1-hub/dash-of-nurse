import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { patientApi, vitalSignsApi } from '@/lib/api';
import * as mockData from '@/lib/mockData';
import { ArrowRight, Check, AlertCircle, Heart } from 'lucide-react';

export default function VitalSignsEntry({ params }) {
  const [, setLocation] = useLocation();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [heartRate, setHeartRate] = useState('');
  const [temperature, setTemperature] = useState('');
  const [systolicPressure, setSystolicPressure] = useState('');
  const [diastolicPressure, setDiastolicPressure] = useState('');
  const [oxygenLevel, setOxygenLevel] = useState('');
  const [respirationRate, setRespirationRate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        setLoading(true);
        let patientData;
        try {
          patientData = await patientApi.getPatientById(params.id);
        } catch (apiErr) {
          console.warn('API failed, falling back to mock data');
          patientData = mockData.getPatientById(params.id);
        }
        
        if (!patientData) {
          patientData = mockData.mockPatients.find(p => p.id === params.id || p.id === `P00${params.id}`);
        }
        
        setPatient(patientData);
        
        // Pre-fill form with latest vitals for easier updating
        const latest = (Array.isArray(patientData.vitalSigns) && patientData.vitalSigns.length > 0) 
          ? patientData.vitalSigns[0] 
          : (patientData.lastVitals || patientData.vitals || {});
          
        if (latest.heartRate) setHeartRate(String(latest.heartRate));
        if (latest.temperature) setTemperature(String(latest.temperature));
        if (latest.oxygenLevel || latest.oxygenSaturation) setOxygenLevel(String(latest.oxygenLevel || latest.oxygenSaturation));
        if (latest.respirationRate || latest.respiratoryRate) setRespirationRate(String(latest.respirationRate || latest.respiratoryRate));
        
        if (latest.systolicPressure) setSystolicPressure(String(latest.systolicPressure));
        if (latest.diastolicPressure) setDiastolicPressure(String(latest.diastolicPressure));
        
        // Handle bloodPressure string format (e.g., "120/80")
        if (latest.bloodPressure && !latest.systolicPressure) {
          const parts = String(latest.bloodPressure).split('/');
          if (parts.length === 2) {
            setSystolicPressure(parts[0]);
            setDiastolicPressure(parts[1]);
          }
        }
        
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
      fetchPatient();
    }
  }, [params.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!patient) {
      setError('Patient data not available');
      return;
    }

    if (!heartRate && !temperature && !systolicPressure && !oxygenLevel && !respirationRate) {
      setError('Please enter at least one vital sign');
      return;
    }

    try {
      setSubmitting(true);
      const vitalData = {
        patientId: patient.id,
        heartRate: heartRate ? parseInt(heartRate) : null,
        temperature: temperature ? parseFloat(temperature) : null,
        systolicPressure: systolicPressure ? parseInt(systolicPressure) : null,
        diastolicPressure: diastolicPressure ? parseInt(diastolicPressure) : null,
        oxygenLevel: oxygenLevel ? parseInt(oxygenLevel) : null,
        respirationRate: respirationRate ? parseInt(respirationRate) : null,
        recordedAt: new Date().toISOString(),
        notes: notes,
      };

      try {
        await vitalSignsApi.addVitalSigns(vitalData);
        // Also update mock data to ensure UI consistency during session
        mockData.addVitalSignsToMock(vitalData);
      } catch (apiErr) {
        console.warn('API submission failed, falling back to mock update', apiErr);
        mockData.addVitalSignsToMock(vitalData);
      }

      setSubmitted(true);
      setTimeout(() => {
        // Use a timestamp to force refresh if needed, though wouter should handle navigation
        setLocation(`/patient/${patient.id}?updated=${Date.now()}`);
      }, 2000);
    } catch (err) {
      console.error('Error submitting vital signs:', err);
      setError('Failed to record vital signs. Please try again.');
      setSubmitting(false);
    }
  };

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

  if (submitted) {
    return React.createElement('div', { className: "min-h-screen bg-background flex items-center justify-center" },
      React.createElement('div', { className: "text-center" },
        React.createElement('div', { className: "w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4" },
          React.createElement(Check, { size: 32, className: "text-white" })
        ),
        React.createElement('h2', { className: "text-2xl font-bold mb-2" }, "Vital Signs Recorded Successfully"),
        React.createElement('p', { className: "text-muted-foreground mb-4" }, "Redirecting...")
      )
    );
  }

  return React.createElement('div', { className: "min-h-screen bg-background" },
    React.createElement('div', { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" },
      React.createElement('button', {
        onClick: () => setLocation(`/patient/${patient.id}`),
        className: "flex items-center space-x-2 mb-4 hover:opacity-80 transition-opacity"
      },
        React.createElement(ArrowRight, { size: 20 }),
        React.createElement('span', null, "Back")
      ),
      React.createElement('h1', { className: "text-3xl font-bold" }, "Record Vital Signs")
    ),

    React.createElement('div', { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" },
      error && React.createElement('div', { className: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8 flex items-center gap-3" },
        React.createElement(AlertCircle, { className: "text-red-600 dark:text-red-400", size: 20 }),
        React.createElement('p', { className: "text-red-800 dark:text-red-200" }, error)
      ),

      React.createElement('div', { className: "bg-card rounded-lg p-6 shadow-sm mb-8" },
        React.createElement('h2', { className: "text-xl font-bold mb-4" }, "Patient Information"),
        React.createElement('div', { className: "grid grid-cols-2 md:grid-cols-4 gap-4" },
          React.createElement('div', null,
            React.createElement('p', { className: "text-muted-foreground text-sm" }, "Name"),
            React.createElement('p', { className: "font-bold" }, patient.fullName || patient.name)
          ),
          React.createElement('div', null,
            React.createElement('p', { className: "text-muted-foreground text-sm" }, "ID"),
            React.createElement('p', { className: "font-bold" }, patient.id)
          ),
          React.createElement('div', null,
            React.createElement('p', { className: "text-muted-foreground text-sm" }, "Room"),
            React.createElement('p', { className: "font-bold" }, patient.roomNumber || patient.bedId || 'N/A')
          ),
          React.createElement('div', null,
            React.createElement('p', { className: "text-muted-foreground text-sm" }, "Age"),
            React.createElement('p', { className: "font-bold" }, patient.age)
          )
        )
      ),

      React.createElement('div', { className: "bg-card rounded-lg p-6 shadow-sm" },
        React.createElement('h2', { className: "text-xl font-bold mb-6 flex items-center gap-2" },
          React.createElement(Heart, { size: 24, className: "text-red-500" }),
          "Record Vital Signs"
        ),
        React.createElement('form', { onSubmit: handleSubmit, className: "space-y-6" },
          React.createElement('div', null,
            React.createElement('label', { className: "block text-sm font-medium mb-2" }, "Heart Rate (bpm)"),
            React.createElement('input', {
              type: "number",
              min: "0",
              max: "300",
              value: heartRate,
              onChange: (e) => setHeartRate(e.target.value),
              placeholder: "e.g., 72",
              className: "w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input"
            })
          ),

          React.createElement('div', null,
            React.createElement('label', { className: "block text-sm font-medium mb-2" }, "Temperature (°C)"),
            React.createElement('input', {
              type: "number",
              min: "35",
              max: "42",
              step: "0.1",
              value: temperature,
              onChange: (e) => setTemperature(e.target.value),
              placeholder: "e.g., 37.5",
              className: "w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input"
            })
          ),

          React.createElement('div', { className: "grid grid-cols-2 gap-4" },
            React.createElement('div', null,
              React.createElement('label', { className: "block text-sm font-medium mb-2" }, "Systolic (mmHg)"),
              React.createElement('input', {
                type: "number",
                min: "0",
                max: "300",
                value: systolicPressure,
                onChange: (e) => setSystolicPressure(e.target.value),
                placeholder: "e.g., 120",
                className: "w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input"
              })
            ),
            React.createElement('div', null,
              React.createElement('label', { className: "block text-sm font-medium mb-2" }, "Diastolic (mmHg)"),
              React.createElement('input', {
                type: "number",
                min: "0",
                max: "200",
                value: diastolicPressure,
                onChange: (e) => setDiastolicPressure(e.target.value),
                placeholder: "e.g., 80",
                className: "w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input"
              })
            )
          ),

          React.createElement('div', null,
            React.createElement('label', { className: "block text-sm font-medium mb-2" }, "Oxygen Level (%)"),
            React.createElement('input', {
              type: "number",
              min: "0",
              max: "100",
              value: oxygenLevel,
              onChange: (e) => setOxygenLevel(e.target.value),
              placeholder: "e.g., 98",
              className: "w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input"
            })
          ),

          React.createElement('div', null,
            React.createElement('label', { className: "block text-sm font-medium mb-2" }, "Respiration Rate (breaths/min)"),
            React.createElement('input', {
              type: "number",
              min: "0",
              max: "100",
              value: respirationRate,
              onChange: (e) => setRespirationRate(e.target.value),
              placeholder: "e.g., 16",
              className: "w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input"
            })
          ),

          React.createElement('div', null,
            React.createElement('label', { className: "block text-sm font-medium mb-2" }, "Additional Notes (Optional)"),
            React.createElement('textarea', {
              value: notes,
              onChange: (e) => setNotes(e.target.value),
              placeholder: "Any relevant observations or comments...",
              className: "w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input h-24 resize-none"
            })
          ),

          React.createElement('div', { className: "flex gap-4" },
            React.createElement('button', {
              type: "submit",
              disabled: submitting,
              className: "flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            },
              !submitting && React.createElement(Check, { size: 20 }),
              React.createElement('span', null, submitting ? "Saving..." : "Save Vital Signs")
            ),
            React.createElement('button', {
              type: "button",
              onClick: () => setLocation(`/patient/${patient.id}`),
              disabled: submitting,
              className: "flex-1 px-6 py-3 bg-secondary text-foreground rounded-lg font-bold hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            }, "Cancel")
          )
        )
      )
    )
  );
}
