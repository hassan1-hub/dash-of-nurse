 function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  ClipboardList,
  Clock,
  FileText,
  PhoneCall,
  Printer,
  Save,
  Send,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { isbarApi } from '@/lib/api';


const recommendationOptions = [
  { value: 'urgent-review', label: 'Request Urgent Review' },
  { value: 'lab-tests', label: 'Request Lab Tests' },
  { value: 'medication-adjustment', label: 'Request Medication Adjustment' },
  { value: 'ward-transfer', label: 'Request Ward Transfer' },
];

const nurseName = 'Nurse Samira';
const nurseCredentials = 'RN – iSHMS Clinical Nursing';

const getSeverityColor = (value, metric) => {
  if (metric === 'oxygenSaturation') {
    if (value <= 91) return 'bg-red-500';
    if (value <= 93) return 'bg-amber-500';
    return 'bg-emerald-500';
  }

  if (metric === 'heartRate') {
    if (value > 130 || value < 40) return 'bg-red-500';
    if (value > 110 || value < 50) return 'bg-amber-500';
    return 'bg-emerald-500';
  }

  if (metric === 'respiratoryRate') {
    if (value >= 25 || value <= 8) return 'bg-red-500';
    if (value >= 21) return 'bg-amber-500';
    return 'bg-emerald-500';
  }

  if (metric === 'temperature') {
    if (value >= 39.1 || value <= 35) return 'bg-red-500';
    if (value >= 38.1 || value <= 36) return 'bg-amber-500';
    return 'bg-emerald-500';
  }

  return 'bg-slate-400';
};

const calculateNEWS2Score = (vitals) => {
  if (!vitals) return 0;
  
  const bloodPressure = vitals.bloodPressure || (vitals.systolicPressure && vitals.diastolicPressure ? `${vitals.systolicPressure}/${vitals.diastolicPressure}` : '120/80');
  const heartRate = vitals.heartRate || vitals.heartRateBpm || 70;
  const oxygenSaturation = vitals.oxygenSaturation || vitals.oxygenLevel || 98;
  const respiratoryRate = vitals.respiratoryRate || vitals.respirationRate || 16;
  const temperature = vitals.temperature || 37;

  const [systolic] = String(bloodPressure).split('/').map(Number);

  const bpScore = systolic <= 90 ? 3 : systolic <= 100 ? 2 : systolic <= 110 ? 1 : 0;
  const hrScore = heartRate >= 131 || heartRate <= 40 ? 3 : heartRate >= 111 ? 2 : heartRate >= 91 ? 1 : 0;
  const rrScore = respiratoryRate >= 25 || respiratoryRate <= 8 ? 3 : respiratoryRate >= 21 ? 2 : respiratoryRate >= 12 ? 0 : 1;
  const spo2Score = oxygenSaturation <= 91 ? 3 : oxygenSaturation <= 93 ? 2 : oxygenSaturation <= 95 ? 1 : 0;
  const tempScore = temperature <= 35 || temperature >= 39.1 ? 3 : temperature >= 38.1 ? 1 : temperature <= 36 ? 1 : 0;

  return bpScore + hrScore + rrScore + spo2Score + tempScore;
};

const stepConfig = [
  {
    key: 'situation',
    label: 'Situation',
    icon: PhoneCall,
    color: 'bg-sky-500',
  },
  {
    key: 'background',
    label: 'Background',
    icon: FileText,
    color: 'bg-amber-500',
  },
  {
    key: 'assessment',
    label: 'Assessment',
    icon: Activity,
    color: 'bg-red-500',
  },
  {
    key: 'recommendation',
    label: 'Recommendation',
    icon: ClipboardList,
    color: 'bg-emerald-500',
  },
];





export default function ISBARModule({ patient }) {
  const [activeStep, setActiveStep] = useState(0);
  const [recommendationType, setRecommendationType] = useState('');
  const [recommendationText, setRecommendationText] = useState('');
  const [draftSaved, setDraftSaved] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isRtl, setIsRtl] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      setIsRtl(document.documentElement.dir === 'rtl');
    }
  }, []);

  const currentVitals = useMemo(() => {
    return (Array.isArray(patient.vitalSigns) && patient.vitalSigns.length > 0) 
      ? patient.vitalSigns[0] 
      : (patient.lastVitals || patient.vitals || {});
  }, [patient]);

  const news2Score = useMemo(() => calculateNEWS2Score(currentVitals), [currentVitals]);
  const situationText = `I am ${nurseName}, calling about ${patient.name || 'the patient'} in Room ${patient.roomNumber || 'N/A'}. The current NEWS2 score is ${news2Score}.`;

  const assessmentTrend = useMemo(() => {
    if (Array.isArray(patient.vitalTrend) && patient.vitalTrend.length >= 3) {
      return patient.vitalTrend.slice(-3);
    }

    const bp = currentVitals.bloodPressure || (currentVitals.systolicPressure && currentVitals.diastolicPressure ? `${currentVitals.systolicPressure}/${currentVitals.diastolicPressure}` : 'N/A');

    return [
      { 
        timestamp: 'Current', 
        bloodPressure: bp, 
        heartRate: currentVitals.heartRate || 'N/A', 
        oxygenSaturation: currentVitals.oxygenSaturation || currentVitals.oxygenLevel || 'N/A', 
        respiratoryRate: currentVitals.respiratoryRate || currentVitals.respirationRate || 'N/A' 
      },
    ];
  }, [patient.vitalTrend, currentVitals]);

  const contentValid = useMemo(() => {
    return recommendationType !== '' && recommendationText.trim().length >= 10;
  }, [recommendationType, recommendationText]);

  const handleSaveDraft = () => {
    setDraftSaved(true);
    window.setTimeout(() => setDraftSaved(false), 2200);
  };

  const handlePrint = () => {
    const reportHtml = `
      <html>
        <head>
          <title>ISBAR Report</title>
          <style>body{font-family:system-ui,sans-serif;padding:24px;color:#111}h1{margin-bottom:16px;}p{margin:0 0 10px;} .badge{display:inline-block;padding:4px 10px;background:#0ea5e9;color:white;border-radius:999px;margin-bottom:12px;}</style>
        </head>
        <body>
          <h1>ISBAR Handover</h1>
          <p><strong>Patient:</strong> ${patient.name} / Room ${patient.roomNumber}</p>
          <p><strong>NEWS2:</strong> ${news2Score}</p>
          <p><strong>Situation:</strong> ${situationText}</p>
          <p><strong>Background:</strong> ${patient.admissionDiagnosis || 'N/A'}</p>
          <p><strong>Comorbidities:</strong> ${Array.isArray(patient.comorbidities) ? patient.comorbidities.join(', ') : 'None'}</p>
          <p><strong>Allergies:</strong> ${Array.isArray(patient.allergies) ? patient.allergies.join(', ') : 'None'}</p>
          <p><strong>Assessment Trend:</strong></p>
          <ul>${assessmentTrend.map((item) => `<li>${item.timestamp} — BP ${item.bloodPressure}, HR ${item.heartRate}, SpO2 ${item.oxygenSaturation}%, RR ${item.respiratoryRate}</li>`).join('')}</ul>
          <p><strong>Recommendation:</strong> ${recommendationType ? _optionalChain([recommendationOptions, 'access', _ => _.find, 'call', _2 => _2(opt => opt.value === recommendationType), 'optionalAccess', _3 => _3.label]) : ''}</p>
          <p>${recommendationText}</p>
          <p style="margin-top:24px;font-size:0.9rem;color:#555;">Submitted by ${nurseCredentials} at ${new Date().toLocaleString()}</p>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(reportHtml);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    setSubmitError('');
    try {
      // Ensure vitals exist to avoid crashes
      const vitals = patient.lastVitals || (Array.isArray(patient.vitalSigns) ? patient.vitalSigns[0] : {}) || {};
      const comorbidities = Array.isArray(patient.comorbidities) ? patient.comorbidities.join(', ') : 'None';
      
      const payload = {
        identification: `This is ${nurseName} calling from the department about ${patient.name || 'the patient'} (Room ${patient.roomNumber || 'N/A'}).`,
        background: `Patient is ${patient.age || 'N/A'} years old admitted for ${patient.admissionDiagnosis || 'observation'}. History: ${comorbidities}. NEWS Score: ${news2Score}. Status: ${patient.status}. Vitals: HR ${vitals.heartRate || 'N/A'}, BP ${vitals.bloodPressure || 'N/A'}, O2 Sat ${vitals.oxygenSaturation || vitals.oxygenLevel || 'N/A'}%, Temp ${vitals.temperature || 'N/A'}C.`
      };

      try {
        // Try to get pre-existing ISBAR from Azure first
        let result;
        try {
          result = await isbarApi.getIsbarReport(patient.id);
        } catch (azureErr) {
          console.warn('Azure GET ISBAR failed, trying generation');
          result = await isbarApi.generateIsbar(payload);
        }
        
        // Handle different response formats from the API
        let text = '';
        if (typeof result === 'string') {
          text = result;
        } else if (result && typeof result === 'object') {
          text = result.isbar || result.content || result.message || result.isbarReport || JSON.stringify(result);
        }
        setRecommendationText(text);
      } catch (apiErr) {
        console.warn('ISBAR API failed, using local generation fallback', apiErr);
        // Fallback: Generate a basic ISBAR text locally if API fails
        const fallbackText = `Patient ${patient.name} shows a NEWS2 score of ${news2Score}. Current vitals are: HR ${vitals.heartRate || 'N/A'}, BP ${vitals.bloodPressure || 'N/A'}. Given the ${patient.status} status, I recommend an urgent review and further assessment of the patient's condition.`;
        setRecommendationText(fallbackText);
      }
      
      setRecommendationType('urgent-review');
      setActiveStep(3); // Move to recommendation step
    } catch (error) {
      setSubmitError('An unexpected error occurred. Please try manual entry.');
      console.error('ISBAR Generation Error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!contentValid) {
      setSubmitError('Please finish the recommendation section before submitting.');
      return;
    }

    const report = {
      patientId: patient.id,
      nurse: nurseName,
      credentials: nurseCredentials,
      timestamp: new Date().toISOString(),
      news2Score,
      situation: situationText,
      diagnosis: patient.admissionDiagnosis,
      comorbidities: patient.comorbidities,
      allergies: patient.allergies,
      assessmentTrend,
      recommendation: {
        type: recommendationType,
        details: recommendationText.trim(),
      },
    };

    window.dispatchEvent(new CustomEvent('isbar-submitted', { detail: report }));
    setSubmitted(true);
    setSubmitError('');
  };

  const stepContent = [
    React.createElement(motion.div, {
      key: "situation",
      initial: { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -12 },
      transition: { duration: 0.2 },
      className: "space-y-5",}

      , React.createElement('div', { className: "rounded-3xl bg-surface/80 dark:bg-background/80 border border-border p-5 shadow-sm"      ,}
        , React.createElement('p', { className: "text-sm text-muted-foreground mb-2 uppercase tracking-[0.2em]"    ,}, "Auto-generated ISBAR statement"  )
        , React.createElement('div', { className: "rounded-2xl bg-secondary/70 p-4 text-sm leading-6 text-foreground"     ,}
          , situationText
        )
      )
      , React.createElement('div', { className: "grid gap-3 sm:grid-cols-2"  ,}
        , React.createElement('div', { className: "rounded-2xl border border-border p-4 bg-surface dark:bg-background"     ,}
          , React.createElement('p', { className: "text-muted-foreground text-sm mb-2"  ,}, "Patient Name" )
          , React.createElement('p', { className: "font-semibold",}, patient.name)
        )
        , React.createElement('div', { className: "rounded-2xl border border-border p-4 bg-surface dark:bg-background"     ,}
          , React.createElement('p', { className: "text-muted-foreground text-sm mb-2"  ,}, "Room Number" )
          , React.createElement('p', { className: "font-semibold",}, patient.roomNumber)
        )
      )
      , React.createElement('div', { className: "rounded-2xl border border-border p-4 bg-surface dark:bg-background"     ,}
        , React.createElement('p', { className: "text-muted-foreground text-sm mb-2"  ,}, "Calculated NEWS2" )
        , React.createElement('p', { className: "text-3xl font-bold" ,}, news2Score)
      )
    ),
    React.createElement(motion.div, {
      key: "background",
      initial: { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -12 },
      transition: { duration: 0.2 },
      className: "space-y-5",}

      , React.createElement('div', { className: "rounded-3xl bg-surface/80 dark:bg-background/80 border border-border p-5 shadow-sm"      ,}
        , React.createElement('p', { className: "text-sm text-muted-foreground uppercase tracking-[0.2em] mb-4"    ,}, "EHR-linked summary" )
        , React.createElement('div', { className: "space-y-4 max-h-48 overflow-y-auto pr-2"   ,}
          , React.createElement('div', { className: "rounded-2xl bg-secondary/70 p-4"  ,}
            , React.createElement('p', { className: "text-sm text-muted-foreground mb-2"  ,}, "Admission Diagnosis" )
            , React.createElement('p', { className: "text-foreground text-sm leading-6"  ,}, patient.admissionDiagnosis)
          )
          , React.createElement('div', { className: "grid gap-3 sm:grid-cols-2"  ,}
            , React.createElement('div', { className: "rounded-2xl bg-surface dark:bg-background p-4 border border-border"     ,}
              , React.createElement('p', { className: "text-sm text-muted-foreground mb-2"  ,}, "Comorbidities")
              , React.createElement('ul', { className: "list-disc list-inside text-sm leading-6 text-foreground"    ,}
                , Array.isArray(patient.comorbidities) && patient.comorbidities.length > 0 
                  ? patient.comorbidities.map((item) => React.createElement('li', { key: item,}, item))
                  : React.createElement('li', null, "None reported")
              )
            )
            , React.createElement('div', { className: "rounded-2xl bg-surface dark:bg-background p-4 border border-border"     ,}
              , React.createElement('p', { className: "text-sm text-muted-foreground mb-2"  ,}, "Allergies")
              , React.createElement('ul', { className: "list-disc list-inside text-sm leading-6 text-foreground"    ,}
                , Array.isArray(patient.allergies) && patient.allergies.length > 0 
                  ? patient.allergies.map((item) => React.createElement('li', { key: item,}, item))
                  : React.createElement('li', null, "None reported")
              )
            )
          )
        )
      )
    ),
    React.createElement(motion.div, {
      key: "assessment",
      initial: { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -12 },
      transition: { duration: 0.2 },
      className: "space-y-5",}

      , React.createElement('div', { className: "rounded-3xl bg-surface/80 dark:bg-background/80 border border-border p-5 shadow-sm"      ,}
        , React.createElement('p', { className: "text-sm text-muted-foreground uppercase tracking-[0.2em] mb-4"    ,}, "Trend-based assessment" )
        , React.createElement('div', { className: "grid gap-4" ,}
          , assessmentTrend.map((trend) => (
            React.createElement('div', { key: trend.timestamp, className: "rounded-2xl border border-border p-4 bg-secondary/70"    ,}
              , React.createElement('div', { className: "flex items-center justify-between mb-3"   ,}
                , React.createElement('p', { className: "font-semibold",}, trend.timestamp)
                , React.createElement('span', { className: "text-xs uppercase tracking-[0.2em] text-muted-foreground"   ,}, "Trend snapshot" )
              )
              , React.createElement('div', { className: "grid gap-3 sm:grid-cols-2"  ,}
                , React.createElement('div', { className: "space-y-3",}
                  , React.createElement('div', { className: "flex items-center justify-between text-sm"   ,}
                    , React.createElement('span', null, "BP")
                    , React.createElement('span', { className: "font-semibold",}, trend.bloodPressure)
                  )
                  , React.createElement('div', { className: "flex items-center justify-between text-sm"   ,}
                    , React.createElement('span', null, "HR")
                    , React.createElement('span', { className: `inline-flex items-center gap-2 font-semibold ${getSeverityColor(trend.heartRate, 'heartRate')}`,}
                      , React.createElement('span', { className: "h-2 w-2 rounded-full"  ,} ), trend.heartRate
                    )
                  )
                  , React.createElement('div', { className: "flex items-center justify-between text-sm"   ,}
                    , React.createElement('span', null, "SpO2")
                    , React.createElement('span', { className: `inline-flex items-center gap-2 font-semibold ${getSeverityColor(trend.oxygenSaturation, 'oxygenSaturation')}`,}
                      , React.createElement('span', { className: "h-2 w-2 rounded-full"  ,} ), trend.oxygenSaturation, "%"
                    )
                  )
                  , React.createElement('div', { className: "flex items-center justify-between text-sm"   ,}
                    , React.createElement('span', null, "RR")
                    , React.createElement('span', { className: `inline-flex items-center gap-2 font-semibold ${getSeverityColor(trend.respiratoryRate, 'respiratoryRate')}`,}
                      , React.createElement('span', { className: "h-2 w-2 rounded-full"  ,} ), trend.respiratoryRate
                    )
                  )
                )
                , React.createElement('div', { className: "space-y-3",}
                  , React.createElement('div', { className: "rounded-2xl bg-surface dark:bg-background p-3"   ,}
                    , React.createElement('p', { className: "text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2"    ,}, "Heatmap")
                    , React.createElement('div', { className: "space-y-2",}
                      , [
	                        { label: 'Temp', value: currentVitals.temperature || 37, metric: 'temperature'  },
	                        { label: 'HR', value: trend.heartRate || 70, metric: 'heartRate'  },
	                        { label: 'SpO2', value: trend.oxygenSaturation || 98, metric: 'oxygenSaturation'  },
	                        { label: 'RR', value: trend.respiratoryRate || 16, metric: 'respiratoryRate'  },
	                      ].map((item) => (
                        React.createElement('div', { key: item.label, className: "flex items-center gap-3"  ,}
                          , React.createElement('span', { className: "w-16 text-xs text-muted-foreground"  ,}, item.label)
                          , React.createElement('div', { className: "h-2 flex-1 rounded-full bg-surface dark:bg-background"    ,}
                            , React.createElement('div', { className: `${getSeverityColor(item.value, item.metric)} h-2 rounded-full`, style: { width: `${Math.min(100, item.value * 3)}%` },} )
                          )
                        )
                      ))
                    )
                  )
                )
              )
            )
          ))
        )
      )
    ),
    React.createElement(motion.div, {
      key: "recommendation",
      initial: { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -12 },
      transition: { duration: 0.2 },
      className: "space-y-5",}

      , React.createElement('div', { className: "rounded-3xl bg-surface/80 dark:bg-background/80 border border-border p-5 shadow-sm"      ,}
        , React.createElement('label', { className: "block text-sm font-medium mb-2 text-foreground"    ,}, "Select Recommendation" )
        , React.createElement('select', {
          value: recommendationType,
          onChange: (event) => setRecommendationType(event.target.value),
          className: "w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"           ,}

          , React.createElement('option', { value: "",}, "Choose action" )
          , recommendationOptions.map((option) => (
            React.createElement('option', { key: option.value, value: option.value,}
              , option.label
            )
          ))
        )
      )
      , React.createElement('div', { className: "rounded-3xl bg-surface/80 dark:bg-background/80 border border-border p-5 shadow-sm"      ,}
        , React.createElement('label', { className: "block text-sm font-medium mb-2 text-foreground"    ,}, "Clinical Recommendation Details"  )
        , React.createElement('textarea', {
          value: recommendationText,
          onChange: (event) => setRecommendationText(event.target.value),
          rows: 5,
          placeholder: "Summarize the action needed, escalation urgency, and any physician-specific instructions..."         ,
          className: "w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"           ,}
        )
      )
    ),
  ];

  return (
    React.createElement('section', { dir: isRtl ? 'rtl' : 'ltr', className: "rounded-[2rem] border border-border bg-surface text-primary shadow-xl shadow-slate-900/5 p-5 md:p-8"        ,}
      , React.createElement('div', { className: "mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"      ,}
        , React.createElement('div', null
          , React.createElement('p', { className: "text-sm uppercase tracking-[0.3em] text-muted-foreground"   ,}, "Smart ISBAR Handover"  )
          , React.createElement('h2', { className: "mt-2 text-3xl font-semibold"  ,}, "Nurse escalation assistant"  )
          , React.createElement('p', { className: "mt-2 text-sm leading-6 text-muted-foreground max-w-2xl"    ,}, "Reduce typing by over 60% with auto-filled situation, EHR-backed background, dynamic vital trends, and fast recommendations."

          )
        )
        , React.createElement('div', { className: "flex flex-wrap items-center gap-3"   ,}
          , React.createElement('span', { className: "inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary"         ,}
            , React.createElement(ShieldAlert, { size: 16,} ), " NEWS2 "  , news2Score
          )
          , React.createElement('span', { className: "inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-500"         ,}
            , React.createElement(Clock, { size: 16,} ), " " , new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          )
        )
      )

      , React.createElement('div', { className: "grid gap-6 lg:grid-cols-[320px_1fr]"  ,}
        , React.createElement('div', { className: "space-y-4 rounded-[2rem] border border-border bg-background/80 p-4 shadow-sm lg:p-5"       ,}
          , React.createElement('div', { className: "hidden sm:block" ,}
            , React.createElement('p', { className: "text-sm text-muted-foreground uppercase tracking-[0.2em] mb-4"    ,}, "Workflow")
            , React.createElement('div', { className: "space-y-3",}
              , stepConfig.map((step, index) => {
                const Icon = step.icon;
                return (
                  React.createElement('button', {
                    key: step.key,
                    type: "button",
                    onClick: () => setActiveStep(index),
                    className: `group flex w-full items-center gap-4 rounded-3xl border p-4 text-left transition ${activeStep === index ? 'border-primary bg-primary/10 shadow-sm' : 'border-border bg-surface hover:bg-surface/90'}`,}

                    , React.createElement('span', { className: `${step.color} grid h-11 w-11 place-items-center rounded-2xl text-white`,}
                      , React.createElement(Icon, { size: 20,} )
                    )
                    , React.createElement('div', null
                      , React.createElement('p', { className: "font-semibold",}, step.label)
                      , React.createElement('p', { className: "text-sm text-muted-foreground" ,}, index + 1, " / 4"  )
                    )
                  )
                );
              })
            )
          )

          , React.createElement('div', { className: "sm:hidden",}
            , React.createElement('div', { className: "flex items-center justify-between gap-3 overflow-x-auto pb-2"     ,}
              , stepConfig.map((step, index) => {
                const Icon = step.icon;
                return (
                  React.createElement('button', {
                    key: step.key,
                    type: "button",
                    onClick: () => setActiveStep(index),
                    className: `min-w-[108px] rounded-3xl border px-3 py-3 text-center text-sm transition ${activeStep === index ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-surface text-foreground'}`,}

                    , React.createElement('div', { className: "flex items-center justify-center gap-2"   ,}
                      , React.createElement('span', { className: `${step.color} inline-flex h-8 w-8 items-center justify-center rounded-full text-white`,}
                        , React.createElement(Icon, { size: 16,} )
                      )
                      , React.createElement('span', null, step.label)
                    )
                  )
                );
              })
            )
          )

          , React.createElement('div', { className: "rounded-[2rem] border border-border bg-surface p-4 text-sm text-muted-foreground"      ,}
            , React.createElement('p', { className: "font-semibold text-foreground mb-3"  ,}, "Patient Snapshot" )
            , React.createElement('dl', { className: "grid gap-3" ,}
              , React.createElement('div', null
                , React.createElement('dt', { className: "text-xs uppercase tracking-[0.2em] text-muted-foreground"   ,}, "Name")
                , React.createElement('dd', { className: "font-semibold",}, patient.name)
              )
              , React.createElement('div', null
                , React.createElement('dt', { className: "text-xs uppercase tracking-[0.2em] text-muted-foreground"   ,}, "Room")
                , React.createElement('dd', { className: "font-semibold",}, patient.roomNumber)
              )
              , React.createElement('div', null
	                , React.createElement('dt', { className: "text-xs uppercase tracking-[0.2em] text-muted-foreground"   ,}, "Diagnosis")
	                , React.createElement('dd', { className: "font-semibold",}, patient.admissionDiagnosis || 'N/A')
	              )
	              , React.createElement('div', null
	                , React.createElement('dt', { className: "text-xs uppercase tracking-[0.2em] text-muted-foreground"   ,}, "Allergies")
	                , React.createElement('dd', { className: "font-semibold",}, Array.isArray(patient.allergies) ? patient.allergies.join(', ') : 'None')
	              )
            )
          )
        )

        , React.createElement('div', { className: "rounded-[2rem] border border-border bg-surface p-6 shadow-sm"     ,}
          , React.createElement('div', { className: "mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"      ,}
            , React.createElement('div', null
              , React.createElement('p', { className: "text-sm text-muted-foreground uppercase tracking-[0.2em]"   ,}, "Step " , activeStep + 1)
              , React.createElement('h3', { className: "text-2xl font-semibold text-foreground"  ,}, stepConfig[activeStep].label)
            )
            , React.createElement('div', { className: "flex gap-2" ,}
              , React.createElement('button', {
                type: "button",
                onClick: handleGenerateAI,
                disabled: isGenerating,
                className: "inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"           ,}
                , isGenerating ? React.createElement(Loader2, { className: "animate-spin", size: 18,} ) : React.createElement(ShieldAlert, { size: 18,} )
                , "Generate with AI"
              )
              , React.createElement('button', {
                type: "button",
                onClick: () => setActiveStep((prev) => Math.min(prev + 1, stepConfig.length - 1)),
                className: "inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"           ,}
                , "Next"
                , React.createElement(ArrowRight, { size: 18,} )
              )
            )
          )

          , React.createElement(AnimatePresence, { mode: "wait",}
            , stepContent[activeStep]
          )

          , React.createElement('form', { onSubmit: handleSubmit, className: "mt-6 space-y-4" ,}
            , submitted && (
              React.createElement('div', { className: "rounded-3xl bg-emerald-500/10 border border-emerald-500 p-4 text-emerald-700"     ,}
                , React.createElement('p', { className: "font-semibold",}, "ISBAR report sent to Physician & HOD audit queue."        )
              )
            )
            , submitError && (
              React.createElement('div', { className: "rounded-3xl bg-rose-500/10 border border-rose-500 p-4 text-rose-700"     ,}
                , submitError
              )
            )
            , React.createElement('div', { className: "grid gap-3 sm:grid-cols-3"  ,}
              , React.createElement('button', {
                type: "submit",
                disabled: !contentValid,
                className: `flex items-center justify-center gap-2 rounded-3xl px-4 py-3 text-sm font-semibold transition ${contentValid ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'cursor-not-allowed bg-slate-200 text-slate-500'}`,}

                , React.createElement(Send, { size: 18,} ), "Send to Physician"

              )
              , React.createElement('button', {
                type: "button",
                onClick: handleSaveDraft,
                className: "flex items-center justify-center gap-2 rounded-3xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-surface"              ,}

                , React.createElement(Save, { size: 18,} ), "Save Draft"

              )
              , React.createElement('button', {
                type: "button",
                onClick: handlePrint,
                className: "flex items-center justify-center gap-2 rounded-3xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-surface"              ,}

                , React.createElement(Printer, { size: 18,} ), "Print PDF"

              )
            )
            , draftSaved && (
              React.createElement('div', { className: "rounded-3xl bg-sky-500/10 border border-sky-500 p-4 text-sky-700"     ,}, "Draft saved locally. You can continue the ISBAR handover later."

              )
            )
            , React.createElement('div', { className: "rounded-3xl bg-secondary/80 border border-border p-4 text-sm text-muted-foreground"      ,}
              , React.createElement('p', { className: "font-semibold text-foreground" ,}, "Audit trail" )
              , React.createElement('p', null, "Nurse: " , nurseCredentials)
              , React.createElement('p', null, "Timestamp: " , new Date().toLocaleString())
              , React.createElement('p', null, "Validated sections: Situation, Background, Assessment, Recommendation"     )
            )
          )
        )
      )
    )
  );
}
