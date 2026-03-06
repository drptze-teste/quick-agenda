import React from 'react';
import { Flower2 } from 'lucide-react';

const BenesseLogo: React.FC = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 bg-corporate-blue rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
        <Flower2 className="text-white" size={24} />
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-lg font-black text-corporate-blue tracking-tighter">BENESSE</span>
        <span className="text-[10px] font-bold text-blue-400 tracking-[0.3em] uppercase">Quick Massage</span>
      </div>
    </div>
  );
};

export default BenesseLogo;
