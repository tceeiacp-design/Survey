
import React, { useState, useEffect } from 'react';
import { User, SurveySubmission, AuditSubmission } from '../types';
import { storageService } from '../services/storageService';

interface SurveyorDashboardProps {
  user: User;
  onNewSurvey: () => void;
  onNewAudit: () => void;
}

const SurveyorDashboard: React.FC<SurveyorDashboardProps> = ({ user, onNewSurvey, onNewAudit }) => {
  const [surveys, setSurveys] = useState<SurveySubmission[]>([]);
  const [audits, setAudits] = useState<AuditSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserStats = async () => {
      try {
        const [allSurveys, allAudits] = await Promise.all([
          storageService.getSurveys(),
          storageService.getAudits()
        ]);
        setSurveys(allSurveys.filter(s => s.surveyorId === user.id));
        setAudits(allAudits.filter(a => a.surveyorId === user.id));
      } catch (e) {
        console.error("Stats load failed", e);
      } finally {
        setLoading(false);
      }
    };
    loadUserStats();
  }, [user.id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-green-600 rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold">Hello, {user.name.split(' ')[0]}!</h2>
        <p className="opacity-90 mt-1 text-sm">Welcome back to the field survey dashboard.</p>
        
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-xs uppercase tracking-wider opacity-70">Surveys Done</p>
            <p className="text-2xl font-bold">{surveys.length}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <p className="text-xs uppercase tracking-wider opacity-70">Audits Done</p>
            <p className="text-2xl font-bold">{audits.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button 
          onClick={onNewSurvey}
          className="flex flex-col items-center justify-center p-8 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-green-300 transition-all text-center space-y-4"
        >
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Conduct Survey</h3>
            <p className="text-sm text-gray-500">General waste management data</p>
          </div>
        </button>

        <button 
          onClick={onNewAudit}
          className="flex flex-col items-center justify-center p-8 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all text-center space-y-4"
        >
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Waste Audit</h3>
            <p className="text-sm text-gray-500">Stall-by-stall composition audit</p>
          </div>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-900">Your Recent Activities</h3>
        </div>
        <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
          {[...surveys, ...audits].sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0)).map((entry, idx) => (
            <div key={idx} className="px-6 py-3 flex items-center justify-between text-sm">
              <div>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mr-2 ${'generalInfo' in entry ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                  {'generalInfo' in entry ? 'Survey' : 'Audit'}
                </span>
                <span className="text-gray-700">
                  {'generalInfo' in entry ? (entry as any).generalInfo.respondentName : `Zone: ${(entry as any).marketZone}`}
                </span>
              </div>
              <span className="text-gray-400 text-xs">
                {entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          ))}
          {surveys.length === 0 && audits.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-400 italic">No submissions yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SurveyorDashboard;
