
import React, { useState, useEffect } from 'react';
import { User, AuditSubmission, WasteAuditEntry, GeoLocation } from '../types';
import { storageService } from '../services/storageService';

interface AuditFormProps {
  user: User;
  onCancel: () => void;
  onSuccess: () => void;
}

const AuditForm: React.FC<AuditFormProps> = ({ user, onCancel, onSuccess }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [coords, setCoords] = useState<GeoLocation | null>(null);

  // Section 1 & 2 State
  const [generalDetails, setGeneralDetails] = useState({
    auditDate: new Date().toISOString().split('T')[0],
    marketZone: '',
    stallCategory: '',
    auditTime: 'Morning' // Default
  });
  
  const [entries, setEntries] = useState<WasteAuditEntry[]>([
    { stallId: '', biodegradable: 0, recyclable: 0, plastic: 0, hazardous: 0, total: 0, notes: '' }
  ]);

  // Section 3 State
  const [composition, setComposition] = useState({
    leafyWaste: { percentage: 0, remarks: '' },
    rottenFruits: { percentage: 0, remarks: '' },
    packagingWaste: { percentage: 0, remarks: '' },
    multiLayerPlastics: { percentage: 0, remarks: '' },
    petBottles: { percentage: 0, remarks: '' },
    otherMixed: { percentage: 0, remarks: '' }
  });

  // Section 4 State
  const [flow, setFlow] = useState({
    generation: { observedPractice: '', issuesIdentified: '' },
    storage: { observedPractice: '', issuesIdentified: '' },
    collection: { observedPractice: '', issuesIdentified: '' },
    transport: { observedPractice: '', issuesIdentified: '' },
    disposal: { observedPractice: '', issuesIdentified: '' }
  });

  // Section 6 State
  const [assessment, setAssessment] = useState({
    totalWasteGenerated: '',
    highWasteClusters: '',
    keyProblems: '',
    improvementOpportunities: ''
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        }),
        (err) => console.warn("Location access denied", err),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  const addEntry = () => {
    setEntries([...entries, { stallId: '', biodegradable: 0, recyclable: 0, plastic: 0, hazardous: 0, total: 0, notes: '' }]);
  };

  const updateEntry = (index: number, field: keyof WasteAuditEntry, value: any) => {
    const newEntries = [...entries];
    const updatedEntry = { ...newEntries[index], [field]: value };
    
    // Auto calculate total
    if (['biodegradable', 'recyclable', 'plastic', 'hazardous'].includes(field)) {
       const val = Number(value) || 0;
       const bio = field === 'biodegradable' ? val : Number(updatedEntry.biodegradable) || 0;
       const rec = field === 'recyclable' ? val : Number(updatedEntry.recyclable) || 0;
       const pla = field === 'plastic' ? val : Number(updatedEntry.plastic) || 0;
       const haz = field === 'hazardous' ? val : Number(updatedEntry.hazardous) || 0;
       updatedEntry.total = bio + rec + pla + haz;
    }
    
    newEntries[index] = updatedEntry;
    setEntries(newEntries);
  };

  const removeEntry = (index: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage(null);
    
    const submission: AuditSubmission = {
      id: Math.random().toString(36).substr(2, 9),
      surveyorId: user.id,
      surveyorName: user.name,
      timestamp: Date.now(),
      ...(coords ? { location: coords } : {}),
      
      // Section 1
      auditDate: generalDetails.auditDate,
      marketZone: generalDetails.marketZone,
      stallCategory: generalDetails.stallCategory,
      auditTime: generalDetails.auditTime,
      stallsCovered: entries.length,

      // Section 2
      entries: entries.map(entry => ({ ...entry, stallId: entry.stallId || 'Unnamed Stall' })),

      // Section 3
      wasteComposition: {
        leafyWaste: { component: 'Leafy Waste', ...composition.leafyWaste },
        rottenFruits: { component: 'Rotten Fruits/Veg', ...composition.rottenFruits },
        packagingWaste: { component: 'Packaging Waste', ...composition.packagingWaste },
        multiLayerPlastics: { component: 'Multi-layer Plastics', ...composition.multiLayerPlastics },
        petBottles: { component: 'PET Bottles', ...composition.petBottles },
        otherMixed: { component: 'Other Mixed Waste', ...composition.otherMixed },
      },

      // Section 4
      wasteFlow: {
        generation: { stage: 'Waste Generation', ...flow.generation },
        storage: { stage: 'Temporary Storage', ...flow.storage },
        collection: { stage: 'Collection', ...flow.collection },
        transport: { stage: 'Transport', ...flow.transport },
        disposal: { stage: 'Final Disposal', ...flow.disposal },
      },

      // Section 6
      assessment: assessment
    };

    try {
      await storageService.saveAudit(submission);
      setStatus('success');
      setTimeout(onSuccess, 1500);
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || "Cloud upload failed. Check your network.");
    }
  };

  const sectionTitleClass = "font-black text-blue-800 text-sm uppercase tracking-wider mb-4 border-b border-blue-100 pb-2";
  const inputClass = "w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-3 border bg-white text-gray-900";
  const labelClass = "block text-xs font-bold text-gray-500 uppercase mb-1";
  const stallInputClass = "w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500";
  const stallLabelClass = "text-[10px] font-bold text-gray-700 uppercase";

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 text-gray-900 animate-fade-in mb-10">
      <div className="bg-blue-600 px-6 py-5 border-b border-gray-100 flex justify-between items-center text-white">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Waste Audit Data Sheet</h2>
          <p className="text-xs opacity-90 mt-0.5 font-medium uppercase tracking-wider">Step {step} of {totalSteps} • Mattuthavani Market</p>
        </div>
        <button onClick={onCancel} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="p-6">
        {status === 'submitting' ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
             <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
             <p className="font-bold text-gray-500 text-sm">Uploading to Firestore...</p>
          </div>
        ) : status === 'success' ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
             <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
             </div>
             <p className="font-black text-blue-700 uppercase tracking-widest text-xs">Verified in Cloud</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {status === 'error' && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold flex items-start space-x-3 mb-6">
                 <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 <span>{errorMessage}</span>
              </div>
            )}

            {/* Step 1: General & Stall-wise */}
            {step === 1 && (
              <div className="space-y-8">
                <div>
                   <h3 className={sectionTitleClass}>Section 1: General Details</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                       <label className={labelClass}>Date of Audit</label>
                       <input type="date" required className={inputClass} value={generalDetails.auditDate} onChange={e => setGeneralDetails({...generalDetails, auditDate: e.target.value})} />
                     </div>
                     <div>
                       <label className={labelClass}>Audit Time</label>
                       <select className={inputClass} value={generalDetails.auditTime} onChange={e => setGeneralDetails({...generalDetails, auditTime: e.target.value})}>
                         <option>Morning</option>
                         <option>Afternoon</option>
                         <option>Evening</option>
                       </select>
                     </div>
                     <div>
                       <label className={labelClass}>Market Zone / Cluster</label>
                       <input type="text" placeholder="e.g. Fruit / Vegetable" className={inputClass} value={generalDetails.marketZone} onChange={e => setGeneralDetails({...generalDetails, marketZone: e.target.value})} />
                     </div>
                     <div>
                       <label className={labelClass}>Stall Category</label>
                       <input type="text" placeholder="e.g. Retail" className={inputClass} value={generalDetails.stallCategory} onChange={e => setGeneralDetails({...generalDetails, stallCategory: e.target.value})} />
                     </div>
                   </div>
                </div>

                <div>
                   <h3 className={sectionTitleClass}>Section 2: Stall-wise Waste Measurement</h3>
                   <div className="space-y-4">
                      {entries.map((entry, idx) => (
                        <div key={idx} className="p-4 border border-gray-200 rounded-xl bg-gray-50 relative">
                           <button type="button" onClick={() => removeEntry(idx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500">
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                           </button>
                           <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-2">
                             <div className="col-span-2 sm:col-span-2">
                               <label className={stallLabelClass}>Stall ID</label>
                               <input type="text" placeholder="ID" className={stallInputClass} value={entry.stallId} onChange={e => updateEntry(idx, 'stallId', e.target.value)} />
                             </div>
                             <div>
                               <label className={stallLabelClass}>Bio (kg)</label>
                               <input type="number" className={stallInputClass} value={entry.biodegradable || ''} onChange={e => updateEntry(idx, 'biodegradable', e.target.value)} />
                             </div>
                             <div>
                               <label className={stallLabelClass}>Recyc (kg)</label>
                               <input type="number" className={stallInputClass} value={entry.recyclable || ''} onChange={e => updateEntry(idx, 'recyclable', e.target.value)} />
                             </div>
                             <div>
                               <label className={stallLabelClass}>Plastic (kg)</label>
                               <input type="number" className={stallInputClass} value={entry.plastic || ''} onChange={e => updateEntry(idx, 'plastic', e.target.value)} />
                             </div>
                             <div>
                               <label className={stallLabelClass}>Haz (kg)</label>
                               <input type="number" className={stallInputClass} value={entry.hazardous || ''} onChange={e => updateEntry(idx, 'hazardous', e.target.value)} />
                             </div>
                           </div>
                           <div className="flex justify-between items-end">
                              <div className="flex-1 mr-4">
                                <label className={stallLabelClass}>Notes/Observations</label>
                                <input type="text" className={stallInputClass} value={entry.notes} onChange={e => updateEntry(idx, 'notes', e.target.value)} />
                              </div>
                              <div className="text-right">
                                <span className={stallLabelClass}>Total</span>
                                <p className="text-lg font-black text-blue-600 leading-none">{entry.total.toFixed(2)}</p>
                              </div>
                           </div>
                        </div>
                      ))}
                      <button type="button" onClick={addEntry} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:border-blue-500 hover:text-blue-500 transition-colors text-sm bg-gray-50">
                        + Add Another Stall
                      </button>
                   </div>
                </div>
              </div>
            )}

            {/* Step 2: Section 3 Composition */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className={sectionTitleClass}>Section 3: Waste Composition (10% Sample)</h3>
                <div className="bg-blue-50 p-4 rounded-xl text-xs text-blue-800 mb-4 border border-blue-100">
                  Provide percentage estimates and remarks for the sampled waste composition.
                </div>
                
                {Object.keys(composition).map((key) => {
                  const k = key as keyof typeof composition;
                  const labels: Record<string, string> = {
                    leafyWaste: "Leafy Waste",
                    rottenFruits: "Rotten Fruits/Vegetables",
                    packagingWaste: "Packaging Waste",
                    multiLayerPlastics: "Multi-layer Plastics",
                    petBottles: "PET Bottles",
                    otherMixed: "Other Mixed Waste"
                  };
                  
                  return (
                    <div key={k} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center border-b border-gray-100 pb-4 last:border-0">
                      <div className="sm:col-span-1 font-bold text-gray-900 text-sm">{labels[k]}</div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block sm:hidden">Percentage (%)</label>
                        <div className="relative">
                          <input type="number" placeholder="0" className={inputClass} value={composition[k].percentage || ''} onChange={e => setComposition({...composition, [k]: { ...composition[k], percentage: Number(e.target.value) }})} />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">%</span>
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block sm:hidden">Remarks</label>
                        <input type="text" placeholder="Remarks..." className={inputClass} value={composition[k].remarks} onChange={e => setComposition({...composition, [k]: { ...composition[k], remarks: e.target.value }})} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Step 3: Section 4 Flow Mapping */}
            {step === 3 && (
              <div className="space-y-6">
                 <h3 className={sectionTitleClass}>Section 4: Waste Flow Mapping</h3>
                 <div className="space-y-6">
                    {Object.keys(flow).map((key) => {
                      const k = key as keyof typeof flow;
                      const stages: Record<string, string> = {
                        generation: "Waste Generation",
                        storage: "Temporary Storage",
                        collection: "Collection by Conservancy Workers",
                        transport: "Transport to Secondary Storage",
                        disposal: "Final Disposal Location"
                      };

                      return (
                        <div key={k} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                           <h4 className="font-bold text-gray-900 mb-3 text-sm">{stages[k]}</h4>
                           <div className="space-y-3">
                             <div>
                               <label className={labelClass}>Observed Practice</label>
                               <textarea rows={2} className={inputClass} value={flow[k].observedPractice} onChange={e => setFlow({...flow, [k]: { ...flow[k], observedPractice: e.target.value }})} />
                             </div>
                             <div>
                               <label className={labelClass}>Issues Identified</label>
                               <textarea rows={2} className={inputClass} value={flow[k].issuesIdentified} onChange={e => setFlow({...flow, [k]: { ...flow[k], issuesIdentified: e.target.value }})} />
                             </div>
                           </div>
                        </div>
                      );
                    })}
                 </div>
              </div>
            )}

            {/* Step 4: Section 6 Assessment */}
            {step === 4 && (
              <div className="space-y-6">
                <h3 className={sectionTitleClass}>Section 6: Overall Assessment Summary</h3>
                <div className="space-y-4">
                   <div>
                     <label className={labelClass}>Total Waste Generated (kg/day)</label>
                     <input type="text" className={inputClass} value={assessment.totalWasteGenerated} onChange={e => setAssessment({...assessment, totalWasteGenerated: e.target.value})} />
                   </div>
                   <div>
                     <label className={labelClass}>High Waste-Generating Clusters</label>
                     <textarea rows={2} className={inputClass} value={assessment.highWasteClusters} onChange={e => setAssessment({...assessment, highWasteClusters: e.target.value})} />
                   </div>
                   <div>
                     <label className={labelClass}>Key Problems Identified</label>
                     <textarea rows={3} className={inputClass} value={assessment.keyProblems} onChange={e => setAssessment({...assessment, keyProblems: e.target.value})} />
                   </div>
                   <div>
                     <label className={labelClass}>Opportunities for Improvement</label>
                     <textarea rows={3} className={inputClass} value={assessment.improvementOpportunities} onChange={e => setAssessment({...assessment, improvementOpportunities: e.target.value})} />
                   </div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-6 border-t border-gray-100 gap-4 mt-6">
              {step > 1 ? (
                 <button type="button" onClick={() => setStep(s => s - 1)} className="px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-200 transition-colors">Back</button>
              ) : (
                <div></div>
              )}
              
              {step < totalSteps ? (
                 <button type="button" onClick={() => setStep(s => s + 1)} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-colors shadow-md">Continue</button>
              ) : (
                 <button type="submit" className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-colors shadow-lg flex items-center">
                    <span>Submit Audit</span>
                    <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                 </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuditForm;
