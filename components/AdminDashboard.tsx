
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { getWasteInsights } from '../services/geminiService';
import { SurveySubmission, AuditSubmission, User } from '../types';

type DashboardEntry = (SurveySubmission & { _type: 'SURVEY' }) | (AuditSubmission & { _type: 'AUDIT' });

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS'>('OVERVIEW');
  const [surveys, setSurveys] = useState<SurveySubmission[]>([]);
  const [audits, setAudits] = useState<AuditSubmission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<string | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'SURVEY' | 'AUDIT'>('ALL');
  const [selectedEntry, setSelectedEntry] = useState<DashboardEntry | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', username: '', password: '', role: 'SURVEYOR' as const });
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sData, aData, uData] = await Promise.all([
          storageService.getSurveys(),
          storageService.getAudits(),
          storageService.getUsers()
        ]);
        setSurveys(sData);
        setAudits(aData);
        setUsers(uData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    if (storageService.isConfigured()) {
      const unsubData = storageService.subscribeToAllData((data) => {
        setSurveys(data.surveys as SurveySubmission[]);
        setAudits(data.audits as AuditSubmission[]);
        setIsLive(true);
        setTimeout(() => setIsLive(false), 2000);
      });
      
      const unsubUsers = storageService.subscribeToUsers((u) => {
        setUsers(u);
      });

      return () => {
        unsubData();
        unsubUsers();
      };
    }
  }, []);

  const fetchInsights = async () => {
    setLoadingInsights(true);
    const result = await getWasteInsights(surveys, audits);
    setInsights(result);
    setLoadingInsights(false);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password || !newUser.name) return;
    try {
      await storageService.createUser(newUser);
      setShowUserModal(false);
      setNewUser({ name: '', username: '', password: '', role: 'SURVEYOR' });
    } catch (e) {
      alert("Failed to create user");
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm("Are you sure?")) {
      await storageService.deleteUser(id);
    }
  };

  // Safe accessor for nested properties to prevent crashes with old data
  const getVal = (obj: any, path: string, fallback = 'N/A') => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj) || fallback;
  };

  const totals = audits.reduce((acc, audit) => {
    return audit.entries.reduce((eAcc, e) => ({
      bio: eAcc.bio + (Number(e.biodegradable) || 0),
      plastic: eAcc.plastic + (Number(e.plastic) || 0),
      recyclable: eAcc.recyclable + (Number(e.recyclable) || 0),
      hazardous: eAcc.hazardous + (Number(e.hazardous) || 0),
      totalWeight: eAcc.totalWeight + (Number(e.total) || 0)
    }), acc);
  }, { bio: 0, plastic: 0, recyclable: 0, hazardous: 0, totalWeight: 0 });

  const segregationCount = surveys.filter(s => s.segregation?.doesSegregate).length;
  const segregationRate = surveys.length > 0 ? Math.round((segregationCount / surveys.length) * 100) : 0;

  const filteredData = [...surveys.map(s => ({ ...s, _type: 'SURVEY' as const })), ...audits.map(a => ({ ...a, _type: 'AUDIT' as const }))]
    .filter(item => {
      if (filter === 'ALL') return true;
      if (filter === 'SURVEY') return item._type === 'SURVEY';
      if (filter === 'AUDIT') return item._type === 'AUDIT';
      return true;
    })
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-gray-600 font-black tracking-widest text-[10px] uppercase">Connecting to Cloud...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Surveys</p>
          <p className="text-3xl font-black text-gray-900 mt-2">{surveys.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Audits</p>
          <p className="text-3xl font-black text-blue-600 mt-2">{audits.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Waste</p>
          <p className="text-3xl font-black text-orange-600 mt-2">{totals.totalWeight.toFixed(0)} <span className="text-sm text-gray-400 font-normal">kg</span></p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Segregation</p>
          <p className="text-3xl font-black text-green-600 mt-2">{segregationRate}%</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-200 p-1 rounded-xl w-fit">
        <button onClick={() => setActiveTab('OVERVIEW')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'OVERVIEW' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Overview</button>
        <button onClick={() => setActiveTab('USERS')} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'USERS' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Staff Management</button>
      </div>

      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* AI Insights */}
          <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-32 bg-indigo-500 rounded-full blur-3xl opacity-20 -mr-16 -mt-16"></div>
             <div className="relative z-10">
               <div className="flex justify-between items-start mb-4">
                 <div>
                   <h3 className="text-xl font-bold flex items-center">
                     <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                     AI Analysis
                   </h3>
                   <p className="text-indigo-200 text-sm mt-1">Generative insights based on real-time data.</p>
                 </div>
                 <button onClick={fetchInsights} disabled={loadingInsights} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50">
                   {loadingInsights ? 'Analyzing...' : 'Refresh Insights'}
                 </button>
               </div>
               
               <div className="bg-black/20 rounded-xl p-6 backdrop-blur-sm min-h-[100px]">
                 {insights ? (
                   <div className="prose prose-invert prose-sm max-w-none">
                     <div dangerouslySetInnerHTML={{ __html: insights.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/^\* /gm, '• ') }} />
                   </div>
                 ) : (
                   <div className="flex flex-col items-center justify-center h-full text-indigo-300">
                     <p className="text-sm">Click refresh to generate new insights about segregation patterns and waste hotspots.</p>
                   </div>
                 )}
               </div>
             </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Recent Submissions</h3>
              <div className="flex space-x-2">
                 {(['ALL', 'SURVEY', 'AUDIT'] as const).map(f => (
                   <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${filter === f ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}>
                     {f}
                   </button>
                 ))}
                 {isLive && <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded animate-pulse">LIVE UPDATE</span>}
              </div>
            </div>
            
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {filteredData.map((item) => (
                <div key={item.id} onClick={() => setSelectedEntry(item)} className="p-4 hover:bg-gray-50 cursor-pointer transition-colors group">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${item._type === 'SURVEY' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                        {item._type === 'SURVEY' ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {item._type === 'SURVEY' 
                            ? getVal(item, 'generalInfo.respondentName', 'Unknown Respondent') 
                            : `Audit: ${getVal(item, 'marketZone')}`}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          by <span className="font-medium">{item.surveyorName}</span> • {new Date(item.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                       {item._type === 'SURVEY' ? (
                         <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${getVal(item, 'segregation.doesSegregate') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                           {getVal(item, 'segregation.doesSegregate') ? 'Segregated' : 'Not Segregated'}
                         </span>
                       ) : (
                         <span className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-widest">
                           {(item as AuditSubmission).stallsCovered} Stalls
                         </span>
                       )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredData.length === 0 && (
                 <div className="p-10 text-center text-gray-400">No data found matching your filter.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'USERS' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Staff Directory</h3>
            <button onClick={() => setShowUserModal(true)} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">
              Add User
            </button>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Username</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-gray-900">{u.name}</td>
                  <td className="px-6 py-4 text-gray-600">{u.username}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>{u.role}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:text-red-700 font-bold text-xs">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-fade-in">
             <h3 className="text-lg font-bold mb-4">Add New User</h3>
             <form onSubmit={handleCreateUser} className="space-y-4">
                <input placeholder="Full Name" required className="w-full p-3 border rounded-xl text-sm" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                <input placeholder="Username" required className="w-full p-3 border rounded-xl text-sm" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
                <input placeholder="Password" type="password" required className="w-full p-3 border rounded-xl text-sm" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                <select className="w-full p-3 border rounded-xl text-sm bg-white" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as any})}>
                  <option value="SURVEYOR">Surveyor</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 p-3 bg-gray-100 font-bold text-gray-600 rounded-xl text-xs">Cancel</button>
                  <button type="submit" className="flex-1 p-3 bg-gray-900 font-bold text-white rounded-xl text-xs">Create</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Detail View Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl animate-fade-in flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{selectedEntry._type === 'SURVEY' ? 'Questionnaire Response' : 'Audit Report'}</p>
                <h2 className="text-xl font-black text-gray-900">
                  {selectedEntry._type === 'SURVEY' ? (selectedEntry as any).generalInfo?.respondentName : `Zone: ${(selectedEntry as any).marketZone}`}
                </h2>
              </div>
              <button onClick={() => setSelectedEntry(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {selectedEntry._type === 'SURVEY' ? (
                <div className="space-y-8">
                  <Section title="A. General Information">
                     <GridField label="Respondent" value={getVal(selectedEntry, 'generalInfo.respondentName')} />
                     <GridField label="Role" value={getVal(selectedEntry, 'generalInfo.role')} />
                     <GridField label="Establishment" value={getVal(selectedEntry, 'generalInfo.establishmentType')} />
                     <GridField label="Shop No." value={getVal(selectedEntry, 'generalInfo.shopNumber')} />
                     <GridField label="Workers" value={getVal(selectedEntry, 'generalInfo.workerCount')} />
                     <GridField label="Op. Hours" value={getVal(selectedEntry, 'generalInfo.operatingHours')} />
                  </Section>

                  <Section title="B. Waste Generation">
                     <GridField label="Quantity/Day" value={getVal(selectedEntry, 'wasteGeneration.quantity')} />
                     <GridField label="Seasonal Var." value={getVal(selectedEntry, 'wasteGeneration.seasonalVariation')} />
                     <div className="col-span-2">
                       <p className="text-xs font-bold text-gray-400 uppercase mb-1">Waste Types</p>
                       <div className="flex flex-wrap gap-1">
                         {((selectedEntry as any).wasteGeneration?.wasteTypes || []).map((t: string) => (
                           <span key={t} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">{t}</span>
                         ))}
                       </div>
                     </div>
                  </Section>

                  <Section title="C. Segregation">
                     <GridField label="Segregates?" value={getVal(selectedEntry, 'segregation.doesSegregate') ? 'YES' : 'NO'} highlight={getVal(selectedEntry, 'segregation.doesSegregate')} />
                     {getVal(selectedEntry, 'segregation.doesSegregate') ? (
                       <GridField label="Method" value={getVal(selectedEntry, 'segregation.segregationMethod')} />
                     ) : (
                       <div className="col-span-2">
                         <p className="text-xs font-bold text-gray-400 uppercase mb-1">Reasons</p>
                         <p className="text-sm text-red-600 font-medium">{((selectedEntry as any).segregation?.reasonsForNotSegregating || []).join(', ') || 'None stated'}</p>
                       </div>
                     )}
                     <GridField label="Color Bins" value={getVal(selectedEntry, 'segregation.hasColorCodedBins') ? 'Available' : 'Missing'} />
                  </Section>

                  <Section title="D. Storage & Handling">
                     <GridField label="Storage Type" value={getVal(selectedEntry, 'storage.storageType')} />
                     <GridField label="Removal Freq" value={getVal(selectedEntry, 'storage.removalFrequency')} />
                     <div className="col-span-2">
                       <p className="text-xs font-bold text-gray-400 uppercase mb-1">Issues</p>
                       <p className="text-sm text-gray-700">{((selectedEntry as any).storage?.storageIssues || []).join(', ') || 'None'}</p>
                     </div>
                  </Section>

                  <Section title="E. Collection">
                     <GridField label="Collector" value={getVal(selectedEntry, 'collection.collector')} />
                     <GridField label="Frequency" value={getVal(selectedEntry, 'collection.collectionFrequency')} />
                     <GridField label="Mode" value={getVal(selectedEntry, 'collection.collectionMode')} />
                     <GridField label="Segregated Collection" value={getVal(selectedEntry, 'collection.isSegregatedCollected')} />
                  </Section>
                  
                  <Section title="G. Plastic & Awareness">
                     <GridField label="Disposal" value={getVal(selectedEntry, 'awareness.disposalLocation')} />
                     <GridField label="Composting Willingness" value={getVal(selectedEntry, 'awareness.compostingWillingness')} />
                     <GridField label="Plastic Rules" value={getVal(selectedEntry, 'plastic.ruleAwareness')} />
                  </Section>

                  <Section title="H & I. Health & Suggestions">
                     <GridField label="Health Issues" value={getVal(selectedEntry, 'healthSafety.healthIssuesNoticed') ? 'Yes' : 'No'} />
                     <GridField label="Cleanliness" value={getVal(selectedEntry, 'healthSafety.cleanlinessRating')} />
                     <div className="col-span-2 mt-2">
                       <p className="text-xs font-bold text-gray-400 uppercase mb-1">Suggestions</p>
                       <p className="text-sm text-gray-800 italic bg-gray-50 p-2 rounded border border-gray-100">"{getVal(selectedEntry, 'suggestions.improvementIdeas') || 'No suggestions'}"</p>
                     </div>
                  </Section>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Audit Details */}
                  <Section title="1. General Details">
                    <GridField label="Market Zone" value={(selectedEntry as AuditSubmission).marketZone} />
                    <GridField label="Category" value={(selectedEntry as AuditSubmission).stallCategory} />
                    <GridField label="Stalls Covered" value={(selectedEntry as AuditSubmission).stallsCovered} />
                    <GridField label="Audit Time" value={(selectedEntry as AuditSubmission).auditTime} />
                  </Section>
                  
                  <Section title="2. Stall-wise Measurement">
                    <div className="col-span-2 space-y-2">
                      {(selectedEntry as AuditSubmission).entries.map((entry, idx) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm">
                          <div className="flex justify-between font-bold text-gray-900 mb-1">
                            <span>{entry.stallId}</span>
                            <span>{entry.total.toFixed(2)} kg</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                             <span className="bg-green-100 text-green-800 p-1 rounded">Bio: {entry.biodegradable}</span>
                             <span className="bg-blue-100 text-blue-800 p-1 rounded">Rec: {entry.recyclable}</span>
                             <span className="bg-yellow-100 text-yellow-800 p-1 rounded">Plas: {entry.plastic}</span>
                             <span className="bg-red-100 text-red-800 p-1 rounded">Haz: {entry.hazardous}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>

                  <Section title="3. Composition Sample (10%)">
                     <div className="col-span-2">
                       <table className="w-full text-xs text-left">
                         <thead className="bg-gray-100 text-gray-500 uppercase">
                           <tr><th className="p-2">Component</th><th className="p-2">%</th><th className="p-2">Remarks</th></tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100">
                           {Object.values((selectedEntry as AuditSubmission).wasteComposition || {}).map((item: any, i) => (
                             <tr key={i}>
                               <td className="p-2 font-bold text-gray-900">{item.component}</td>
                               <td className="p-2 font-bold text-gray-900">{item.percentage}%</td>
                               <td className="p-2 text-gray-600">{item.remarks}</td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                  </Section>

                  <Section title="4. Flow Mapping">
                     <div className="col-span-2 space-y-2">
                       {Object.values((selectedEntry as AuditSubmission).wasteFlow || {}).map((item: any, i) => (
                         <div key={i} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                           <p className="font-bold text-xs text-indigo-900 mb-1">{item.stage}</p>
                           <div className="grid grid-cols-2 gap-2 text-xs">
                             <div><span className="font-bold text-gray-400">Observed:</span> <br/><span className="text-gray-800">{item.observedPractice || '-'}</span></div>
                             <div><span className="font-bold text-red-400">Issues:</span> <br/><span className="text-gray-800">{item.issuesIdentified || '-'}</span></div>
                           </div>
                         </div>
                       ))}
                     </div>
                  </Section>

                  <Section title="6. Assessment Summary">
                    <GridField label="Total Gen." value={(selectedEntry as AuditSubmission).assessment?.totalWasteGenerated} />
                    <GridField label="High Waste Clusters" value={(selectedEntry as AuditSubmission).assessment?.highWasteClusters} />
                    <div className="col-span-2">
                       <p className="text-[10px] font-bold text-gray-400 uppercase">Key Problems</p>
                       <p className="text-sm bg-red-50 text-red-800 p-2 rounded mt-1">{(selectedEntry as AuditSubmission).assessment?.keyProblems}</p>
                    </div>
                    <div className="col-span-2">
                       <p className="text-[10px] font-bold text-gray-400 uppercase">Improvements</p>
                       <p className="text-sm bg-green-50 text-green-800 p-2 rounded mt-1">{(selectedEntry as AuditSubmission).assessment?.improvementOpportunities}</p>
                    </div>
                  </Section>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-100 rounded-b-2xl text-center">
               <span className="text-xs text-gray-400 font-mono uppercase">ID: {selectedEntry.id}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Components
const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="border-b border-gray-100 pb-4 mb-4">
    <h4 className="font-black text-xs text-indigo-900 uppercase tracking-widest mb-3">{title}</h4>
    <div className="grid grid-cols-2 gap-4">
      {children}
    </div>
  </div>
);

const GridField = ({ label, value, highlight }: { label: string, value: any, highlight?: boolean }) => (
  <div>
    <p className="text-[10px] font-bold text-gray-400 uppercase">{label}</p>
    <p className={`text-sm font-semibold ${highlight ? 'text-green-600' : 'text-gray-900'}`}>{value !== undefined && value !== null ? value : 'N/A'}</p>
  </div>
);

export default AdminDashboard;
