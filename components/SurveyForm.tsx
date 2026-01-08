
import React, { useState, useEffect } from 'react';
import { User, SurveySubmission, GeoLocation } from '../types';
import { storageService } from '../services/storageService';
import { 
  ESTABLISHMENT_TYPES, WASTE_TYPES, QUANTITY_OPTIONS, SEASONAL_VARIATIONS,
  SEGREGATION_METHODS, NO_SEGREGATION_REASONS, STORAGE_TYPES, REMOVAL_FREQUENCIES,
  STORAGE_ISSUES, COLLECTORS, COLLECTION_FREQUENCIES, COLLECTION_MODES,
  SEGREGATED_COLLECTION_STATUS, DISPOSAL_LOCATIONS, PROCESSING_METHOD_AWARENESS,
  PARTICIPATION_WILLINGNESS, PLASTIC_TYPES_USED, RULE_AWARENESS,
  PLASTIC_DISPOSAL_PRACTICES, PROTECTIVE_EQUIPMENT_USAGE, CLEANLINESS_LEVELS
} from '../constants';

interface SurveyFormProps {
  user: User;
  onCancel: () => void;
  onSuccess: () => void;
}

const SurveyForm: React.FC<SurveyFormProps> = ({ user, onCancel, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [coords, setCoords] = useState<GeoLocation | null>(null);
  const totalSteps = 5;

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }),
        (err) => console.warn("Location access denied", err),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  const [formData, setFormData] = useState<Partial<SurveySubmission>>({
    surveyorId: user.id,
    surveyorName: user.name,
    generalInfo: {
      respondentName: '',
      role: '',
      establishmentType: ESTABLISHMENT_TYPES[0],
      shopNumber: '',
      operatingHours: '',
      workerCount: 0
    },
    wasteGeneration: {
      wasteTypes: [],
      quantity: QUANTITY_OPTIONS[0],
      seasonalVariation: SEASONAL_VARIATIONS[0],
    },
    segregation: {
      doesSegregate: false,
      hasColorCodedBins: false
    },
    storage: {
      storageType: STORAGE_TYPES[0],
      removalFrequency: REMOVAL_FREQUENCIES[0],
      storageIssues: []
    },
    collection: {
      collector: COLLECTORS[0],
      collectionFrequency: COLLECTION_FREQUENCIES[0],
      collectionMode: COLLECTION_MODES[0],
      isSegregatedCollected: SEGREGATED_COLLECTION_STATUS[0]
    },
    awareness: {
      disposalLocation: DISPOSAL_LOCATIONS[0],
      processingMethodAwareness: PROCESSING_METHOD_AWARENESS[0],
      compostingWillingness: PARTICIPATION_WILLINGNESS[0]
    },
    plastic: {
      typesUsed: [],
      ruleAwareness: RULE_AWARENESS[0],
      disposalPractice: PLASTIC_DISPOSAL_PRACTICES[0]
    },
    healthSafety: {
      healthIssuesNoticed: false,
      protectiveEquipmentUsage: PROTECTIVE_EQUIPMENT_USAGE[0],
      cleanlinessRating: CLEANLINESS_LEVELS[0]
    },
    suggestions: {
      improvementIdeas: '',
      supportRequired: '',
      willingnessToCooperate: true
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    
    const finalSubmission: SurveySubmission = {
      ...formData as SurveySubmission,
      id: Math.random().toString(36).substr(2, 9),
      surveyorId: user.id,
      surveyorName: user.name,
      timestamp: Date.now(),
      ...(coords ? { location: coords } : {})
    };

    try {
      await storageService.saveSurvey(finalSubmission);
      setStatus('success');
      setTimeout(onSuccess, 1500);
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || "Failed to save survey.");
    }
  };

  const updateNested = (section: keyof SurveySubmission, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section] as any, [field]: value }
    }));
  };

  const toggleArrayItem = (section: keyof SurveySubmission, field: string, item: string) => {
    const currentList = (formData[section] as any)[field] || [];
    const newList = currentList.includes(item) 
      ? currentList.filter((i: string) => i !== item)
      : [...currentList, item];
    updateNested(section, field, newList);
  };

  const inputClass = "w-full rounded-xl border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm p-3 border bg-white";
  const labelClass = "block text-xs font-bold text-gray-500 uppercase mb-1";
  const sectionTitleClass = "font-black text-green-800 text-sm uppercase tracking-wider mb-4 border-b border-green-100 pb-2";

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 animate-fade-in text-gray-900 pb-4">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Baseline Questionnaire</h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Step {step} of {totalSteps}</p>
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
      </div>

      <div className="p-6">
        {status === 'submitting' ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-gray-500">Saving Data...</p>
          </div>
        ) : status === 'success' ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
             <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
             </div>
             <p className="font-bold text-green-700">Survey Saved Successfully</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {status === 'error' && <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg">{errorMessage}</div>}

            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className={sectionTitleClass}>A. General Information</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className={labelClass}>1. Name of Respondent</label>
                      <input type="text" className={inputClass} required value={formData.generalInfo?.respondentName} onChange={(e) => updateNested('generalInfo', 'respondentName', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelClass}>2. Designation / Role</label>
                      <input type="text" className={inputClass} placeholder="Owner, Worker, etc." required value={formData.generalInfo?.role} onChange={(e) => updateNested('generalInfo', 'role', e.target.value)} />
                    </div>
                    <div>
                      <label className={labelClass}>3. Type of Establishment</label>
                      <select className={inputClass} value={formData.generalInfo?.establishmentType} onChange={(e) => updateNested('generalInfo', 'establishmentType', e.target.value)}>
                        {ESTABLISHMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      {formData.generalInfo?.establishmentType === 'Others' && (
                        <input type="text" placeholder="Specify..." className={`${inputClass} mt-2`} value={formData.generalInfo?.otherEstablishmentType || ''} onChange={(e) => updateNested('generalInfo', 'otherEstablishmentType', e.target.value)} />
                      )}
                    </div>
                    <div>
                      <label className={labelClass}>4. Shop No. / Location</label>
                      <input type="text" className={inputClass} required value={formData.generalInfo?.shopNumber} onChange={(e) => updateNested('generalInfo', 'shopNumber', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>5. Op. Hours</label>
                        <input type="text" placeholder="e.g. 8AM - 8PM" className={inputClass} value={formData.generalInfo?.operatingHours} onChange={(e) => updateNested('generalInfo', 'operatingHours', e.target.value)} />
                      </div>
                      <div>
                        <label className={labelClass}>6. Workers</label>
                        <input type="number" className={inputClass} value={formData.generalInfo?.workerCount} onChange={(e) => updateNested('generalInfo', 'workerCount', Number(e.target.value))} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <div>
                  <h3 className={sectionTitleClass}>B. Waste Generation Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>7. Types of Waste Generated</label>
                      <div className="grid grid-cols-1 gap-2 mt-2 bg-gray-50 p-3 rounded-xl border border-gray-200 max-h-48 overflow-y-auto">
                        {WASTE_TYPES.map(t => (
                          <label key={t} className="flex items-center space-x-3 p-1">
                            <input type="checkbox" className="rounded text-green-600 focus:ring-green-500" 
                              checked={formData.wasteGeneration?.wasteTypes?.includes(t)}
                              onChange={() => toggleArrayItem('wasteGeneration', 'wasteTypes', t)}
                            />
                            <span className="text-sm text-gray-700">{t}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>8. Quantity per Day</label>
                      <select className={inputClass} value={formData.wasteGeneration?.quantity} onChange={(e) => updateNested('wasteGeneration', 'quantity', e.target.value)}>
                        {QUANTITY_OPTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>9. Seasonal Variation</label>
                      <select className={inputClass} value={formData.wasteGeneration?.seasonalVariation} onChange={(e) => updateNested('wasteGeneration', 'seasonalVariation', e.target.value)}>
                        {SEASONAL_VARIATIONS.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                      {formData.wasteGeneration?.seasonalVariation?.includes('High increase') && (
                        <input type="text" placeholder="Specify months..." className={`${inputClass} mt-2`} value={formData.wasteGeneration?.seasonalMonths || ''} onChange={(e) => updateNested('wasteGeneration', 'seasonalMonths', e.target.value)} />
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className={sectionTitleClass}>C. Segregation Practices</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border">
                      <label className="text-sm font-bold text-gray-700">10. Do you segregate waste?</label>
                      <div className="flex space-x-4">
                         <label className="flex items-center space-x-2"><input type="radio" name="seg" checked={formData.segregation?.doesSegregate === true} onChange={() => updateNested('segregation', 'doesSegregate', true)} className="text-green-600" /> <span>Yes</span></label>
                         <label className="flex items-center space-x-2"><input type="radio" name="seg" checked={formData.segregation?.doesSegregate === false} onChange={() => updateNested('segregation', 'doesSegregate', false)} className="text-red-600" /> <span>No</span></label>
                      </div>
                    </div>

                    {formData.segregation?.doesSegregate ? (
                      <div>
                        <label className={labelClass}>11. How is segregation done?</label>
                        <select className={inputClass} value={formData.segregation?.segregationMethod || ''} onChange={(e) => updateNested('segregation', 'segregationMethod', e.target.value)}>
                          <option value="">Select Method</option>
                          {SEGREGATION_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className={labelClass}>12. Reasons for not segregating</label>
                        <div className="grid grid-cols-1 gap-2 mt-2">
                           {NO_SEGREGATION_REASONS.map(r => (
                             <label key={r} className="flex items-center space-x-3">
                               <input type="checkbox" checked={formData.segregation?.reasonsForNotSegregating?.includes(r)} onChange={() => toggleArrayItem('segregation', 'reasonsForNotSegregating', r)} className="rounded text-red-600" />
                               <span className="text-sm text-gray-700">{r}</span>
                             </label>
                           ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border">
                      <label className="text-sm font-bold text-gray-700">13. Color-coded bins available?</label>
                      <div className="flex space-x-4">
                         <label className="flex items-center space-x-2"><input type="radio" name="bins" checked={formData.segregation?.hasColorCodedBins === true} onChange={() => updateNested('segregation', 'hasColorCodedBins', true)} className="text-green-600" /> <span>Yes</span></label>
                         <label className="flex items-center space-x-2"><input type="radio" name="bins" checked={formData.segregation?.hasColorCodedBins === false} onChange={() => updateNested('segregation', 'hasColorCodedBins', false)} className="text-red-600" /> <span>No</span></label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8">
                <div>
                   <h3 className={sectionTitleClass}>D. Storage & Handling</h3>
                   <div className="space-y-4">
                     <div>
                       <label className={labelClass}>14. Type of storage used</label>
                       <select className={inputClass} value={formData.storage?.storageType} onChange={(e) => updateNested('storage', 'storageType', e.target.value)}>
                         {STORAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                       </select>
                     </div>
                     <div>
                       <label className={labelClass}>15. Frequency of removal</label>
                       <select className={inputClass} value={formData.storage?.removalFrequency} onChange={(e) => updateNested('storage', 'removalFrequency', e.target.value)}>
                         {REMOVAL_FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                       </select>
                     </div>
                     <div>
                       <label className={labelClass}>16. Issues faced (Storage)</label>
                       <div className="grid grid-cols-2 gap-2 mt-1">
                          {STORAGE_ISSUES.map(i => (
                            <label key={i} className="flex items-center space-x-2">
                              <input type="checkbox" checked={formData.storage?.storageIssues?.includes(i)} onChange={() => toggleArrayItem('storage', 'storageIssues', i)} className="rounded text-blue-600" />
                              <span className="text-xs text-gray-700">{i}</span>
                            </label>
                          ))}
                       </div>
                     </div>
                   </div>
                </div>

                <div>
                   <h3 className={sectionTitleClass}>E. Collection & Transportation</h3>
                   <div className="space-y-4">
                     <div>
                       <label className={labelClass}>17. Who collects waste?</label>
                       <select className={inputClass} value={formData.collection?.collector} onChange={(e) => updateNested('collection', 'collector', e.target.value)}>
                         {COLLECTORS.map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>18. Freq. of Collection</label>
                          <select className={inputClass} value={formData.collection?.collectionFrequency} onChange={(e) => updateNested('collection', 'collectionFrequency', e.target.value)}>
                            {COLLECTION_FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelClass}>19. Mode</label>
                          <select className={inputClass} value={formData.collection?.collectionMode} onChange={(e) => updateNested('collection', 'collectionMode', e.target.value)}>
                            {COLLECTION_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                     </div>
                     <div>
                        <label className={labelClass}>20. Is segregated waste collected separately?</label>
                        <select className={inputClass} value={formData.collection?.isSegregatedCollected} onChange={(e) => updateNested('collection', 'isSegregatedCollected', e.target.value)}>
                          {SEGREGATED_COLLECTION_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                     </div>
                   </div>
                </div>
              </div>
            )}

            {step === 4 && (
               <div className="space-y-8">
                 <div>
                   <h3 className={sectionTitleClass}>F. Treatment & Disposal Awareness</h3>
                   <div className="space-y-4">
                     <div>
                        <label className={labelClass}>21. Where is waste taken?</label>
                        <select className={inputClass} value={formData.awareness?.disposalLocation} onChange={(e) => updateNested('awareness', 'disposalLocation', e.target.value)}>
                          {DISPOSAL_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className={labelClass}>22. Awareness of methods</label>
                        <select className={inputClass} value={formData.awareness?.processingMethodAwareness} onChange={(e) => updateNested('awareness', 'processingMethodAwareness', e.target.value)}>
                          {PROCESSING_METHOD_AWARENESS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className={labelClass}>23. Willingness for on-site composting</label>
                        <select className={inputClass} value={formData.awareness?.compostingWillingness} onChange={(e) => updateNested('awareness', 'compostingWillingness', e.target.value)}>
                          {PARTICIPATION_WILLINGNESS.map(w => <option key={w} value={w}>{w}</option>)}
                        </select>
                     </div>
                   </div>
                 </div>

                 <div>
                    <h3 className={sectionTitleClass}>G. Plastic Waste Management</h3>
                    <div className="space-y-4">
                       <div>
                         <label className={labelClass}>24. Type of plastic used</label>
                         <div className="mt-1 space-y-2">
                           {PLASTIC_TYPES_USED.map(p => (
                             <label key={p} className="flex items-center space-x-2">
                               <input type="checkbox" checked={formData.plastic?.typesUsed?.includes(p)} onChange={() => toggleArrayItem('plastic', 'typesUsed', p)} className="rounded text-orange-600" />
                               <span className="text-sm text-gray-700">{p}</span>
                             </label>
                           ))}
                         </div>
                       </div>
                       <div>
                          <label className={labelClass}>25. Rule Awareness (PWM)</label>
                          <select className={inputClass} value={formData.plastic?.ruleAwareness} onChange={(e) => updateNested('plastic', 'ruleAwareness', e.target.value)}>
                            {RULE_AWARENESS.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                       </div>
                       <div>
                          <label className={labelClass}>26. Disposal Practice</label>
                          <select className={inputClass} value={formData.plastic?.disposalPractice} onChange={(e) => updateNested('plastic', 'disposalPractice', e.target.value)}>
                            {PLASTIC_DISPOSAL_PRACTICES.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                       </div>
                    </div>
                 </div>
               </div>
            )}

            {step === 5 && (
              <div className="space-y-8">
                 <div>
                    <h3 className={sectionTitleClass}>H. Health & Safety</h3>
                    <div className="space-y-4">
                       <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border">
                         <label className="text-sm font-bold text-gray-700">27. Health issues noticed?</label>
                         <div className="flex space-x-4">
                           <label className="flex items-center space-x-2"><input type="radio" name="health" checked={formData.healthSafety?.healthIssuesNoticed === true} onChange={() => updateNested('healthSafety', 'healthIssuesNoticed', true)} className="text-red-600" /> <span>Yes</span></label>
                           <label className="flex items-center space-x-2"><input type="radio" name="health" checked={formData.healthSafety?.healthIssuesNoticed === false} onChange={() => updateNested('healthSafety', 'healthIssuesNoticed', false)} className="text-green-600" /> <span>No</span></label>
                         </div>
                       </div>
                       {formData.healthSafety?.healthIssuesNoticed && (
                         <input type="text" placeholder="Specify issues..." className={inputClass} value={formData.healthSafety?.healthIssueDetails || ''} onChange={(e) => updateNested('healthSafety', 'healthIssueDetails', e.target.value)} />
                       )}
                       <div>
                          <label className={labelClass}>28. Protective Equipment Usage</label>
                          <select className={inputClass} value={formData.healthSafety?.protectiveEquipmentUsage} onChange={(e) => updateNested('healthSafety', 'protectiveEquipmentUsage', e.target.value)}>
                            {PROTECTIVE_EQUIPMENT_USAGE.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                       </div>
                       <div>
                          <label className={labelClass}>29. Overall Cleanliness</label>
                          <select className={inputClass} value={formData.healthSafety?.cleanlinessRating} onChange={(e) => updateNested('healthSafety', 'cleanlinessRating', e.target.value)}>
                            {CLEANLINESS_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                          </select>
                       </div>
                    </div>
                 </div>

                 <div>
                    <h3 className={sectionTitleClass}>I. Suggestions & Improvement</h3>
                    <div className="space-y-4">
                       <div>
                         <label className={labelClass}>30. Suggestions for Improvement</label>
                         <textarea className={inputClass} rows={3} value={formData.suggestions?.improvementIdeas} onChange={(e) => updateNested('suggestions', 'improvementIdeas', e.target.value)} />
                       </div>
                       <div>
                         <label className={labelClass}>31. Support Required from Authorities</label>
                         <textarea className={inputClass} rows={3} value={formData.suggestions?.supportRequired} onChange={(e) => updateNested('suggestions', 'supportRequired', e.target.value)} />
                       </div>
                       <div className="flex items-center justify-between bg-green-50 p-4 rounded-xl border border-green-200">
                          <label className="text-sm font-bold text-green-900">32. Willing to cooperate in future?</label>
                          <div className="flex space-x-4">
                            <label className="flex items-center space-x-2"><input type="radio" name="coop" checked={formData.suggestions?.willingnessToCooperate === true} onChange={() => updateNested('suggestions', 'willingnessToCooperate', true)} className="text-green-700" /> <span className="font-bold">Yes</span></label>
                            <label className="flex items-center space-x-2"><input type="radio" name="coop" checked={formData.suggestions?.willingnessToCooperate === false} onChange={() => updateNested('suggestions', 'willingnessToCooperate', false)} className="text-gray-600" /> <span>No</span></label>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            )}

            <div className="flex justify-between pt-6 border-t border-gray-100 mt-6">
              {step > 1 ? (
                <button type="button" onClick={() => setStep(s => s - 1)} className="px-6 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-200">Back</button>
              ) : (
                <div></div>
              )}
              
              {step < totalSteps ? (
                <button type="button" onClick={() => setStep(s => s + 1)} className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl text-sm hover:bg-green-700 shadow-md">Continue</button>
              ) : (
                <button type="submit" className="px-8 py-3 bg-green-700 text-white font-bold rounded-xl text-sm hover:bg-green-800 shadow-lg flex items-center">
                  <span>Submit Survey</span>
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

export default SurveyForm;
