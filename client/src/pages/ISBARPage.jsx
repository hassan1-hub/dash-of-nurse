import React, { useState, useEffect } from "react";
import { useLocation } from 'wouter';
import { patientApi } from '@/lib/api';
import ISBARModule from '@/components/ISBARModule';
import { ArrowRight } from 'lucide-react';

export default function ISBARPage({ params }) {
  const [, setLocation] = useLocation();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!params?.id) return;
    patientApi.getPatientById(params.id)
      .then(setPatient)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [params?.id]);

  if (loading) {
    return React.createElement('div', { className: "min-h-screen bg-background flex items-center justify-center" },
      React.createElement('div', { className: "text-center" },
        React.createElement('div', { className: "w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" }),
        React.createElement('p', { className: "text-muted-foreground mt-4" }, 'Loading patient data...')
      )
    );
  }

  if (!patient) {
    return React.createElement('div', { className: "min-h-screen bg-background flex items-center justify-center" },
      React.createElement('div', { className: "text-center px-4" },
        error && React.createElement('p', { className: "text-red-500 mb-4" }, error),
        React.createElement('p', { className: "text-lg text-muted-foreground mb-4" }, 'Patient not found'),
        React.createElement('button', {
          onClick: () => setLocation('/'),
          className: "px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90",
        }, 'Back to Home')
      )
    );
  }

  return React.createElement('div', { className: "min-h-screen bg-background" },
    React.createElement('div', { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" },
      React.createElement('button', {
        onClick: () => setLocation(`/patient/${patient.id}`),
        className: "flex items-center space-x-2 mb-4 hover:opacity-80 transition-opacity",
      },
        React.createElement(ArrowRight, { size: 20 }),
        React.createElement('span', null, 'Back')
      ),
      React.createElement('h1', { className: "text-3xl font-bold" }, 'ISBAR Handover'),
      React.createElement('p', { className: "text-muted-foreground mt-2" }, 'Dedicated escalation workflow for the nurse handover module.')
    ),
    React.createElement('div', { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" },
      React.createElement(ISBARModule, { patient })
    )
  );
}
