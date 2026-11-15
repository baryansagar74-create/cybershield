import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldAlert,
  Search,
  FileText,
  FileCheck2,
  BarChart3,
  Settings,
  LogOut,
  User,
} from 'lucide-react';
import { useAuth } from '../utils/auth';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: ShieldAlert },
  { name: 'Scan Profile', path: '/scan', icon: Search },
  { name: 'Takedown Cases', path: '/cases', icon: FileText },
  { name: 'Audit Trail', path: '/audit', icon: FileCheck2 },
  { name: 'Reports & Export', path: '/reports', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-[#0B2545] text-white flex flex-col justify-between shrink-0 h-screen sticky top-0 shadow-lg select-none">
      <div>
        {/* Logo / Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-[#13315C]">
          <img
            src="/icon_192.png"
            alt="ProfileGuard Icon"
            className="w-8 h-8 rounded-lg object-contain shadow-md"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-wide text-white">ProfileGuard</h1>
            <p className="text-[10px] text-amber-300 font-semibold tracking-wider">ITBP / MHA CYBERSHIELD</p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#134074] text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:bg-[#13315C] hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User profile footer */}
      <div className="p-4 border-t border-[#13315C] bg-[#081B33]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-[#134074] flex items-center justify-center text-xs font-bold text-slate-200">
              <User className="w-4 h-4" />
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-white truncate">{user?.name || user?.email || 'Officer'}</p>
              <p className="text-[10px] text-slate-400 capitalize">{user?.role || 'Analyst'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 rounded-md hover:bg-[#13315C] text-slate-400 hover:text-red-400 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <div className="text-[10px] text-slate-400 text-center tracking-wider">
          v1.0 • IT Rules 2026 Ready
        </div>
      </div>
    </aside>
  );
}
