import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { alertApi } from '@/lib/api';
import * as mockData from '@/lib/mockData';
import { AlertCircle, CheckCircle, Clock, Info, ArrowRight } from 'lucide-react';

export default function Alerts() {
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState('all');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        let data;
        try {
          const apiResponse = await alertApi.getAlertsByRole('Nurse');
          // Handle both direct array response and wrapped response
          data = Array.isArray(apiResponse) ? apiResponse : apiResponse?.data || apiResponse?.alerts || [];
          
          if (!data || (Array.isArray(data) && data.length === 0)) {
            console.warn('API returned no alerts, falling back to mock data');
            data = mockData.getAllAlerts();
          }
        } catch (apiErr) {
          console.warn('Alerts API failed, falling back to mock data', apiErr);
          data = mockData.getAllAlerts();
        }

        // Normalize alert data to handle both API and mock formats
        const normalizedAlerts = Array.isArray(data) ? data.map(alert => ({
          ...alert,
          id: alert.id || alert.Id || alert.alertId,
          patientId: alert.patientId || alert.PatientId || alert.patient_id,
          patientName: alert.patientName || alert.PatientName || alert.patient_name || 'Unknown',
          title: alert.title || alert.Title || alert.alertTitle || 'Alert',
          description: alert.description || alert.Description || alert.message || alert.Message || '',
          type: (alert.type || alert.Type || alert.alertType || 'notification').toLowerCase(),
          priority: (alert.priority || alert.Priority || alert.severity || 'medium').toLowerCase(),
          timestamp: alert.timestamp || alert.Timestamp || alert.createdAt || alert.CreatedAt || new Date().toISOString(),
          read: alert.read ?? alert.Read ?? alert.isRead ?? alert.IsRead ?? false,
        })) : [];

        setAlerts(normalizedAlerts);
        setError(null);
      } catch (err) {
        console.error('Error in fetchAlerts:', err);
        setError('Failed to load alerts. Using backup data.');
        setAlerts(mockData.getAllAlerts());
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const getFilteredAlerts = () => {
    let filtered = alerts;
    
    if (filter === 'unread') {
      filtered = filtered.filter(a => !a.read);
    } else if (filter === 'high') {
      filtered = filtered.filter(a => a.priority === 'high');
    } else if (filter === 'medium') {
      filtered = filtered.filter(a => a.priority === 'medium');
    } else if (filter === 'low') {
      filtered = filtered.filter(a => a.priority === 'low');
    }
    
    return filtered;
  };

  const handleAlertClick = async (alert) => {
    if (!alert.read) {
      try {
        await alertApi.markAsRead(alert.id);
      } catch (err) {
        console.warn('Failed to mark alert as read via API, updating locally', err);
      }
      // Update locally regardless of API success
      setAlerts(alerts.map(a => a.id === alert.id ? { ...a, read: true } : a));
      mockData.markAlertAsRead(alert.id);
    }
    if (alert.patientId) {
      setLocation(`/patient/${alert.patientId}`);
    }
  };

  const filteredAlerts = getFilteredAlerts();
  const unreadCount = alerts.filter(a => !a.read).length;

  const getAlertIcon = (type) => {
    switch (type) {
      case 'vitals':
        return React.createElement(AlertCircle, { className: "text-red-500", size: 20,} );
      case 'medication':
        return React.createElement(Clock, { className: "text-blue-500", size: 20,} );
      case 'task':
        return React.createElement(CheckCircle, { className: "text-yellow-500", size: 20,} );
      case 'notification':
        return React.createElement(Info, { className: "text-green-500", size: 20,} );
      default:
        return React.createElement(Info, { size: 20,} );
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertTypeLabel = (type) => {
    switch (type) {
      case 'vitals':
        return 'Vital Signs';
      case 'medication':
        return 'Medication';
      case 'task':
        return 'Task';
      case 'notification':
        return 'Notification';
      default:
        return 'Alert';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    React.createElement('div', { className: "min-h-screen bg-background" ,}
      , React.createElement('div', { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"     ,}
        /* Error Alert */
        , error && React.createElement('div', { className: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8 flex items-center gap-3"        ,}
          , React.createElement(AlertCircle, { className: "text-red-600 dark:text-red-400", size: 20,} )
          , React.createElement('p', { className: "text-red-800 dark:text-red-200" ,}, error)
        )

        /* Filter Buttons */
        , React.createElement('div', { className: "bg-card rounded-lg p-6 shadow-sm mb-8"    ,}
          , React.createElement('div', { className: "flex gap-2 flex-wrap"  ,}
            , React.createElement('button', {
              onClick: () => setFilter('all'),
              className: `px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`,}
, "All Alerts"

            )
            , React.createElement('button', {
              onClick: () => setFilter('unread'),
              className: `px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`,}
, "Unread ("
               , unreadCount, ")"
            )
            , React.createElement('button', {
              onClick: () => setFilter('high'),
              className: `px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'high'
                  ? 'bg-red-600 text-white'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`,}
, "High Priority"

            )
            , React.createElement('button', {
              onClick: () => setFilter('medium'),
              className: `px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'medium'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`,}
, "Medium Priority"

            )
            , React.createElement('button', {
              onClick: () => setFilter('low'),
              className: `px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'low'
                  ? 'bg-green-600 text-white'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`,}
, "Low Priority"

            )
          )
        )

        /* Loading State */
        , loading && React.createElement('div', { className: "text-center py-12" ,}
          , React.createElement('div', { className: "inline-block" ,}
            , React.createElement('div', { className: "w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" ,})
          )
          , React.createElement('p', { className: "text-muted-foreground mt-4" ,}, "Loading alerts...")
        )

        /* Alerts List */
        , !loading && filteredAlerts.length > 0 && (
          React.createElement('div', { className: "space-y-4",}
            , filteredAlerts.map((alert) => (
              React.createElement('div', {
                key: alert.id,
                className: `bg-card rounded-lg p-6 shadow-sm border-l-4 transition-all hover:shadow-md cursor-pointer ${
                  alert.priority === 'high'
                    ? 'border-red-500'
                    : alert.priority === 'medium'
                    ? 'border-yellow-500'
                    : 'border-green-500'
                } ${!alert.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`,
                onClick: () => handleAlertClick(alert),}

                , React.createElement('div', { className: "flex items-start justify-between gap-4"   ,}
                  , React.createElement('div', { className: "flex items-start gap-4 flex-1"   ,}
                    , React.createElement('div', { className: "mt-1",}
                      , getAlertIcon(alert.type)
                    )
                    , React.createElement('div', { className: "flex-1",}
                      , React.createElement('div', { className: "flex items-center gap-2 mb-2"   ,}
                        , React.createElement('h3', { className: "font-bold text-lg" ,}, alert.title)
                        , React.createElement('span', { className: `px-2 py-1 rounded text-xs font-medium ${getPriorityColor(alert.priority)}`,}
                          , alert.priority.toUpperCase()
                        )
                        , React.createElement('span', { className: "px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"        ,}
                          , getAlertTypeLabel(alert.type)
                        )
                        , !alert.read && (
                          React.createElement('span', { className: "w-2 h-2 bg-blue-500 rounded-full"   ,})
                        )
                      )
                      , React.createElement('p', { className: "text-muted-foreground mb-2" ,}, alert.description)
                      , React.createElement('div', { className: "flex items-center justify-between text-sm"   ,}
                        , React.createElement('div', { className: "text-muted-foreground",}
                          , React.createElement('span', { className: "font-medium",}, "Patient:"), " " , alert.patientName, " (ID: "  , alert.patientId, ")"
                        )
                        , React.createElement('span', { className: "text-xs text-muted-foreground" ,}, formatTime(alert.timestamp))
                      )
                    )
                  )
                  , React.createElement('div', { className: "flex-shrink-0",}
                    , React.createElement(ArrowRight, { className: "text-muted-foreground", size: 20,} )
                  )
                )
              )
            ))
          )
        )

        /* Empty State */
        , !loading && filteredAlerts.length === 0 && (
          React.createElement('div', { className: "text-center py-12 bg-card rounded-lg"   ,}
            , React.createElement(CheckCircle, { className: "w-16 h-16 text-green-500 mx-auto mb-4"    ,} )
            , React.createElement('p', { className: "text-muted-foreground text-lg" ,}, "No alerts to display"   )
            , React.createElement('p', { className: "text-muted-foreground text-sm mt-2"  ,}, "All systems are running smoothly"    )
          )
        )
      )
    )
  );
}
