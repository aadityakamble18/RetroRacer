import React from 'react';
import { MAX_SPEED } from '../constants';

interface DashboardProps {
  score: number;
  speed: number;
}

const Dashboard: React.FC<DashboardProps> = ({ score, speed }) => {
  const speedPercent = Math.min((speed / MAX_SPEED) * 100, 100);
  
  return (
    <div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 flex justify-between items-start pointer-events-none gap-2">
      {/* Score Panel */}
      <div className="bg-black/80 border border-green-500/50 p-2 sm:p-3 rounded backdrop-blur-sm flex-1 max-w-[150px]">
        <div className="text-[10px] sm:text-xs text-green-600 font-mono">DIST</div>
        <div className="text-xl sm:text-2xl font-bold text-green-400 font-mono tracking-widest">
          {Math.floor(score).toString().padStart(6, '0')}
        </div>
      </div>

      {/* Speedometer */}
      <div className="bg-black/80 border border-green-500/50 p-2 sm:p-3 rounded backdrop-blur-sm flex-1 max-w-[200px]">
        <div className="text-[10px] sm:text-xs text-green-600 font-mono flex justify-between">
          <span>VELOCITY</span>
          <span>{Math.floor(speed * 10)} km/h</span>
        </div>
        <div className="w-full h-2 sm:h-3 bg-gray-900 mt-1 rounded-full overflow-hidden border border-gray-700">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-yellow-500 transition-all duration-100 ease-out"
            style={{ width: `${speedPercent}%` }}
          />
        </div>
        
        {/* RPM / Gear decoration */}
        <div className="flex gap-1 mt-1">
            {[...Array(5)].map((_, i) => (
                <div 
                    key={i} 
                    className={`h-1 flex-1 rounded-sm ${i < (speedPercent / 20) ? 'bg-green-500' : 'bg-green-900/30'}`} 
                />
            ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;