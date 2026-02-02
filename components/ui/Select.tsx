
import React from 'react';

interface SelectProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({ label, options, value, onChange, icon }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
        {label}
      </label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 group-hover:text-indigo-300 transition-colors">
            {icon}
          </div>
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 ${icon ? 'pl-11' : 'px-4'} pr-10 appearance-none text-sm font-bold text-white focus:ring-2 focus:ring-indigo-500 outline-none hover:bg-white/10 transition-all cursor-pointer`}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};
