import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { patientApi } from '@/lib/api';
import * as mockData from '@/lib/mockData';
import PatientCard from '@/components/PatientCard';
import { Search, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const normalizeStatus = (status = '') => {
    const normalized = String(status).trim().toLowerCase().replace(/\s+/g, '_');
    if (['stable', 'critical', 'needs_care'].includes(normalized)) return normalized;
    return 'unknown';
  };

  const normalizePatient = (patient) => {
    // 1. Get original vitals from API
    const originalVitals = (Array.isArray(patient.vitalSigns) && patient.vitalSigns.length > 0) 
      ? patient.vitalSigns[0] 
      : (patient.lastVitals || patient.vitals || null);
      
    // 2. Check for local session vitals (Highest Priority)
    let localVitals = null;
    try {
      const localData = JSON.parse(localStorage.getItem('session_vitals') || '{}');
      localVitals = localData[patient.id];
    } catch(e) {}

    // 3. Override original vitals with local session vitals if they exist
    // This ensures the dashboard IMMEDIATELY shows what the user just saved
    const vitals = localVitals ? { ...originalVitals, ...localVitals } : originalVitals;

    return {
      ...patient,
      normalizedStatus: normalizeStatus(patient.status),
      name: patient.name || patient.fullName || 'Unknown Patient',
      roomNumber: patient.roomNumber || (patient.bedId != null ? String(patient.bedId) : ''),
      lastVitals: vitals,
      // Force pass vitals directly to ensure PatientCard uses the merged ones
      vitals: vitals,
      vitalSigns: [vitals] 
    };
  };

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        let data;
        try {
          data = await patientApi.getAllPatients();
          if (!data || (Array.isArray(data) && data.length === 0)) {
            console.warn('API returned no data, falling back to mock data');
            data = [...mockData.mockPatients];
          } else {
            // For each patient from API, we could try to get latest vitals if the API doesn't include them
            // but for performance, we'll assume the list API is updated or we'll handle it in PatientDetails
          }
        } catch (apiErr) {
          console.warn('API failed, falling back to mock data', apiErr);
          data = [...mockData.mockPatients];
        }
        
        const normalized = Array.isArray(data) ? data.map(normalizePatient) : [];
        setPatients(normalized);
        setError(null);
      } catch (err) {
        console.error('Error in fetchPatients:', err);
        setError('Failed to load patients. Using backup data.');
        setPatients(mockData.mockPatients.map(normalizePatient));
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const getPatients = () => {
    let filtered = patients;
    
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(p => p.normalizedStatus === selectedStatus);
    }
    
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        (p.name && p.name.toLowerCase().includes(query)) || 
        (p.fullName && p.fullName.toLowerCase().includes(query)) || 
        String(p.id).toLowerCase().includes(query) || 
        String(p.roomNumber).toLowerCase().includes(query) || 
        String(p.bedId).toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  const getPatientsByStatus = (status) => {
    return patients.filter(p => p.normalizedStatus === status);
  };

  const filteredPatients = getPatients();
  const stableCount = getPatientsByStatus('stable').length;
  const criticalCount = getPatientsByStatus('critical').length;
  const needsCareCount = getPatientsByStatus('needs_care').length;

  return (
    React.createElement('div', { className: "min-h-screen bg-background" ,}
      , React.createElement('div', { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"     ,}
        /* Error Alert */
        , error && React.createElement('div', { className: "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-8 flex items-center gap-3"        ,}
          , React.createElement(AlertCircle, { className: "text-amber-600 dark:text-amber-400", size: 20,} )
          , React.createElement('p', { className: "text-amber-800 dark:text-amber-200" ,}, error)
        )

        /* Stats Cards */
        , React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"    ,}
          , React.createElement('div', { className: "bg-card rounded-lg p-6 shadow-sm border-l-4 border-status-stable"     ,}
            , React.createElement('div', { className: "flex justify-between items-center"  ,}
              , React.createElement('div', null
                , React.createElement('p', { className: "text-muted-foreground text-sm" ,}, "Stable Patients" )
                , React.createElement('p', { className: "text-3xl font-bold text-status-stable"  ,}, stableCount)
              )
              , React.createElement('div', { className: "w-12 h-12 bg-status-stable/10 rounded-lg flex items-center justify-center"      ,}
                , React.createElement('span', { className: "text-2xl",}, "✓")
              )
            )
          )

          , React.createElement('div', { className: "bg-card rounded-lg p-6 shadow-sm border-l-4 border-status-critical"     ,}
            , React.createElement('div', { className: "flex justify-between items-center"  ,}
              , React.createElement('div', null
                , React.createElement('p', { className: "text-muted-foreground text-sm" ,}, "Critical Cases" )
                , React.createElement('p', { className: "text-3xl font-bold text-status-critical"  ,}, criticalCount)
              )
              , React.createElement('div', { className: "w-12 h-12 bg-status-critical/10 rounded-lg flex items-center justify-center animate-pulse"       ,}
                , React.createElement('span', { className: "text-2xl",}, "!")
              )
            )
          )

          , React.createElement('div', { className: "bg-card rounded-lg p-6 shadow-sm border-l-4 border-status-needs-care"     ,}
            , React.createElement('div', { className: "flex justify-between items-center"  ,}
              , React.createElement('div', null
                , React.createElement('p', { className: "text-muted-foreground text-sm" ,}, "Needs Care" )
                , React.createElement('p', { className: "text-3xl font-bold text-status-needs-care"  ,}, needsCareCount)
              )
              , React.createElement('div', { className: "w-12 h-12 bg-status-needs-care/10 rounded-lg flex items-center justify-center"      ,}
                , React.createElement('span', { className: "text-2xl",}, "⚠")
              )
            )
          )
        )

        /* Search and Filter */
        , React.createElement('div', { className: "bg-card rounded-lg p-6 shadow-sm mb-8"    ,}
          , React.createElement('div', { className: "flex flex-col sm:flex-row gap-4"   ,}
            , React.createElement('div', { className: "flex-1 relative" ,}
              , React.createElement(Search, { className: "absolute right-3 top-3 text-muted-foreground"   , size: 20,} )
              , React.createElement('input', {
                type: "text",
                placeholder: "Search patient by name or ID..."     ,
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                className: "w-full pl-4 pr-10 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input"          ,}
              )
            )

            , React.createElement('div', { className: "flex gap-2 flex-wrap"  ,}
              , React.createElement('button', {
                onClick: () => setSelectedStatus('all'),
                className: `px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedStatus === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                }`,}
, "All"

              )
              , React.createElement('button', {
                onClick: () => setSelectedStatus('stable'),
                className: `px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedStatus === 'stable'
                    ? 'bg-status-stable text-white'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                }`,}
, "Stable"

              )
              , React.createElement('button', {
                onClick: () => setSelectedStatus('critical'),
                className: `px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedStatus === 'critical'
                    ? 'bg-status-critical text-white'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                }`,}
, "Critical"

              )
              , React.createElement('button', {
                onClick: () => setSelectedStatus('needs_care'),
                className: `px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedStatus === 'needs_care'
                    ? 'bg-status-needs-care text-white'
                    : 'bg-secondary text-foreground hover:bg-secondary/80'
                }`,}
, "Needs Care"

              )
            )
          )
        )

        /* Loading State */
        , loading && React.createElement('div', { className: "text-center py-12" ,}
          , React.createElement('div', { className: "inline-block" ,}
            , React.createElement('div', { className: "w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" ,})
          )
          , React.createElement('p', { className: "text-muted-foreground mt-4" ,}, "Loading patients...")
        )

        /* Patients Grid */
        , !loading && filteredPatients.length > 0 && (
          React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"    ,}
            , filteredPatients.map((patient) => (
              React.createElement(PatientCard, {
                key: patient.id,
                patient: patient,
                onClick: () => setLocation(`/patient/${patient.id}`),}
              )
            ))
          )
        )

        /* Empty State */
        , !loading && filteredPatients.length === 0 && (
          React.createElement('div', { className: "text-center py-12" ,}
            , React.createElement('p', { className: "text-muted-foreground text-lg" ,}, "No results found"  )
          )
        )
      )
    )
  );
}
