
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { storageService } from '../services/storageService';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  onHome: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, onHome }) => {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const status = await storageService.checkConnection();
      setIsOnline(status);
    };
    checkStatus();
    // Re-check periodically
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-4xl">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={onHome}>
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">E</div>
          <h1 className="font-bold text-gray-800 text-lg hidden sm:block">EcoSurvey</h1>
        </div>
        
        <div className="flex items-center space-x-3 sm:space-x-6">
          <div className="flex items-center space-x-1 hidden xs:flex">
             <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-amber-400'}`}></div>
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
               {isOnline ? 'Cloud Active' : 'Offline Mode'}
             </span>
          </div>

          <div className="text-right hidden sm:block border-l pl-4 border-gray-100">
            <p className="text-sm font-semibold text-gray-900 leading-none">{user.name}</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{user.role}</p>
          </div>

          <button 
            onClick={onLogout}
            className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-xl transition-all"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
