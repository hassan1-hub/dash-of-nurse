import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { patientApi, medicationApi } from '@/lib/api';
import { ArrowRight, Check, AlertCircle } from 'lucide-react';

export default function MedicationAdmin({ params }) {
  const [, setLocation] = useLocation();
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [amountGiven, setAmountGiven] = useState('');
  const [patient, setPatient] = useState(null);
  const [medication, setMedication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const patientData = await patientApi.getPatientById(params.id);
        setPatient(patientData);
        
        // Try to find medication in patient data or fetch separately
        if (patientData && patientData.medications) {
          const med = patientData.medications.find(m => m.id === params.medicationId);
          setMedication(med || null);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load medication data. Please try again later.');
        setPatient(null);
        setMedication(null);
      } finally {
        setLoading(false);
      }
    };

    if (params.id && params.medicationId) {
      fetchData();
    }
  }, [params.id, params.medicationId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!patient || !medication) {
      setError('Missing patient or medication data');
      return;
    }

    try {
      setSubmitting(true);
      
      // Prepare administration data
      const administrationData = {
        patientId: patient.id,
        medicationId: medication.id,
        amountGiven: amountGiven || medication.dosage,
        administeredAt: new Date().toISOString(),
        notes: notes,
      };

      // Call API to record medication administration
      await medicationApi.administerMedication(administrationData);
      
      setSubmitted(true);
      setTimeout(() => {
        setLocation(`/patient/${patient.id}`);
      }, 2000);
    } catch (err) {
      console.error('Error submitting medication:', err);
      setError('Failed to record medication administration. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return React.createElement('div', { className: "min-h-screen bg-background flex items-center justify-center" ,}
      , React.createElement('div', { className: "text-center" ,}
        , React.createElement('div', { className: "inline-block" ,}
          , React.createElement('div', { className: "w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" ,})
        )
        , React.createElement('p', { className: "text-muted-foreground mt-4" ,}, "Loading medication data...")
      )
    );
  }

  if (!patient || !medication) {
    return (
      React.createElement('div', { className: "min-h-screen bg-background flex items-center justify-center"    ,}
        , React.createElement('div', { className: "text-center",}
          , error && React.createElement('div', { className: "mb-4 flex items-center justify-center gap-2 text-red-600" ,}
            , React.createElement(AlertCircle, { size: 20 ,})
            , React.createElement('p', { className: "text-lg" ,}, error)
          )
          , !error && React.createElement('p', { className: "text-lg text-muted-foreground mb-4"  ,}, "Data not found"  )
          , React.createElement('button', {
            onClick: () => setLocation('/'),
            className: "px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"     ,}
, "Back to Dashboard"

          )
        )
      )
    );
  }

  if (submitted) {
    return (
      React.createElement('div', { className: "min-h-screen bg-background flex items-center justify-center"    ,}
        , React.createElement('div', { className: "text-center",}
          , React.createElement('div', { className: "w-16 h-16 bg-status-stable rounded-full flex items-center justify-center mx-auto mb-4"        ,}
            , React.createElement(Check, { size: 32, className: "text-white",} )
          )
          , React.createElement('h2', { className: "text-2xl font-bold mb-2"  ,}, "Medication Administered Successfully"  )
          , React.createElement('p', { className: "text-muted-foreground mb-4" ,}, "Redirecting...")
        )
      )
    );
  }

  return (
    React.createElement('div', { className: "min-h-screen bg-background" ,}
      , React.createElement('div', { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" ,}
          , React.createElement('button', {
            onClick: () => setLocation(`/patient/${patient.id}`),
            className: "flex items-center space-x-2 mb-4 hover:opacity-80 transition-opacity"     ,}

            , React.createElement(ArrowRight, { size: 20,} )
            , React.createElement('span', null, "Back")
          )
          , React.createElement('h1', { className: "text-3xl font-bold" ,}, "Administer Medication" )
        )
      )

      , React.createElement('div', { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"     ,}
        /* Error Alert */
        , error && React.createElement('div', { className: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8 flex items-center gap-3"        ,}
          , React.createElement(AlertCircle, { className: "text-red-600 dark:text-red-400", size: 20,} )
          , React.createElement('p', { className: "text-red-800 dark:text-red-200" ,}, error)
        )

        /* Patient Info */
        , React.createElement('div', { className: "bg-card rounded-lg p-6 shadow-sm mb-8"    ,}
          , React.createElement('h2', { className: "text-xl font-bold mb-4"  ,}, "Patient Information" )
          , React.createElement('div', { className: "grid grid-cols-2 md:grid-cols-4 gap-4"   ,}
            , React.createElement('div', null
              , React.createElement('p', { className: "text-muted-foreground text-sm" ,}, "Name")
              , React.createElement('p', { className: "font-bold",}, patient.name)
            )
            , React.createElement('div', null
              , React.createElement('p', { className: "text-muted-foreground text-sm" ,}, "ID")
              , React.createElement('p', { className: "font-bold",}, patient.id)
            )
            , React.createElement('div', null
              , React.createElement('p', { className: "text-muted-foreground text-sm" ,}, "Room")
              , React.createElement('p', { className: "font-bold",}, patient.roomNumber)
            )
            , React.createElement('div', null
              , React.createElement('p', { className: "text-muted-foreground text-sm" ,}, "Age")
              , React.createElement('p', { className: "font-bold",}, patient.age)
            )
          )
        )

        /* Medication Info */
        , React.createElement('div', { className: "bg-card rounded-lg p-6 shadow-sm mb-8"    ,}
          , React.createElement('h2', { className: "text-xl font-bold mb-4"  ,}, "Medication Information" )
          , React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 gap-6"   ,}
            , React.createElement('div', null
              , React.createElement('p', { className: "text-muted-foreground text-sm mb-1"  ,}, "Medication Name" )
              , React.createElement('p', { className: "text-2xl font-bold text-primary"  ,}, medication.name)
            )
            , React.createElement('div', null
              , React.createElement('p', { className: "text-muted-foreground text-sm mb-1"  ,}, "Prescribed Dosage" )
              , React.createElement('p', { className: "text-2xl font-bold" ,}, medication.dosage)
            )
            , React.createElement('div', null
              , React.createElement('p', { className: "text-muted-foreground text-sm mb-1"  ,}, "Frequency")
              , React.createElement('p', { className: "text-lg font-bold" ,}, medication.frequency)
            )
            , React.createElement('div', null
              , React.createElement('p', { className: "text-muted-foreground text-sm mb-1"  ,}, "Route")
              , React.createElement('p', { className: "text-lg font-bold" ,}, medication.route)
            )
            , medication.prescribedBy && React.createElement('div', null
              , React.createElement('p', { className: "text-muted-foreground text-sm mb-1"  ,}, "Prescribed By" )
              , React.createElement('p', { className: "text-lg font-bold" ,}, medication.prescribedBy)
            )
            , medication.prescribedDate && React.createElement('div', null
              , React.createElement('p', { className: "text-muted-foreground text-sm mb-1"  ,}, "Prescription Date" )
              , React.createElement('p', { className: "text-lg font-bold" ,}, medication.prescribedDate)
            )
          )
        )

        /* Medication Administration Form */
        , React.createElement('div', { className: "bg-card rounded-lg p-6 shadow-sm"   ,}
          , React.createElement('h2', { className: "text-xl font-bold mb-6"  ,}, "Record Medication Administration"  )
          , React.createElement('form', { onSubmit: handleSubmit, className: "space-y-6",}
            /* Safety Checks */
            , React.createElement('div', { className: "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"      ,}
              , React.createElement('h3', { className: "font-bold mb-4 text-blue-900 dark:text-blue-100"   ,}, "Safety Verification Checklist"  )
              , React.createElement('div', { className: "space-y-3",}
                , React.createElement('label', { className: "flex items-center space-x-3 cursor-pointer"   ,}
                  , React.createElement('input', {
                    type: "checkbox",
                    required: true,
                    className: "w-4 h-4 rounded border-border"   ,}
                  )
                  , React.createElement('span', { className: "text-sm",}, "Verified patient identity"  )
                )
                , React.createElement('label', { className: "flex items-center space-x-3 cursor-pointer"   ,}
                  , React.createElement('input', {
                    type: "checkbox",
                    required: true,
                    className: "w-4 h-4 rounded border-border"   ,}
                  )
                  , React.createElement('span', { className: "text-sm",}, "Verified medication name and dosage"    )
                )
                , React.createElement('label', { className: "flex items-center space-x-3 cursor-pointer"   ,}
                  , React.createElement('input', {
                    type: "checkbox",
                    required: true,
                    className: "w-4 h-4 rounded border-border"   ,}
                  )
                  , React.createElement('span', { className: "text-sm",}, "Verified medication expiration date"   )
                )
                , React.createElement('label', { className: "flex items-center space-x-3 cursor-pointer"   ,}
                  , React.createElement('input', {
                    type: "checkbox",
                    required: true,
                    className: "w-4 h-4 rounded border-border"   ,}
                  )
                  , React.createElement('span', { className: "text-sm",}, "Verified no allergies"  )
                )
              )
            )

            /* Amount Given */
            , React.createElement('div', null
              , React.createElement('label', { className: "block text-sm font-medium mb-2"   ,}, "Amount Administered" )
              , React.createElement('input', {
                type: "text",
                value: amountGiven,
                onChange: (e) => setAmountGiven(e.target.value),
                placeholder: `e.g., ${medication.dosage}`,
                className: "w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input"         ,}
              )
            )

            /* Time */
            , React.createElement('div', null
              , React.createElement('label', { className: "block text-sm font-medium mb-2"   ,}, "Time of Administration"  )
              , React.createElement('input', {
                type: "time",
                defaultValue: new Date().toTimeString().slice(0, 5),
                className: "w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input"         ,}
              )
            )

            /* Notes */
            , React.createElement('div', null
              , React.createElement('label', { className: "block text-sm font-medium mb-2"   ,}, "Additional Notes (Optional)"  )
              , React.createElement('textarea', {
                value: notes,
                onChange: (e) => setNotes(e.target.value),
                placeholder: "Any relevant observations or comments..."    ,
                className: "w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input h-24 resize-none"           ,}
              )
            )

            /* Submit Button */
            , React.createElement('div', { className: "flex gap-4" ,}
              , React.createElement('button', {
                type: "submit",
                disabled: submitting,
                className: "flex-1 px-6 py-3 bg-status-stable text-white rounded-lg font-bold hover:bg-status-stable/90 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"            ,}

                , !submitting && React.createElement(Check, { size: 20,} )
                , React.createElement('span', null, submitting ? "Submitting..." : "Confirm Medication Administration"  )
              )
              , React.createElement('button', {
                type: "button",
                onClick: () => setLocation(`/patient/${patient.id}`),
                disabled: submitting,
                className: "flex-1 px-6 py-3 bg-secondary text-foreground rounded-lg font-bold hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"        ,}
, "Cancel"

              )
            )
          )
        )
      )
    );
}
