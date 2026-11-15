import React from 'react';
import { Bell, ShieldCheck } from 'lucide-react';

export default function Header({ title, subtitle }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-slate-800 leading-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>I4C Sahyog Channel Ready</span>
        </div>

        <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition relative">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-red-500 absolute top-1.5 right-1.5" />
        </button>
      </div>
    </header>
  );
}
