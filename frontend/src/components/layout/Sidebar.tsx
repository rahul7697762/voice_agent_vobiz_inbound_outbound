import { Link, useLocation } from "react-router-dom";
import {
    BarChart3,
    Calendar,
    Bot,
    Mic,
    KeyRound,
    PhoneCall,
    Users
} from "lucide-react";

export function Sidebar() {
    const location = useLocation();
    const currentPath = location.pathname;

    const isActive = (path: string) => currentPath === path;

    return (
        <nav className="w-60 min-w-[240px] bg-[#161b27] border-r border-[#2a3448] flex flex-col py-6 relative z-10">
            <div className="px-5 pb-6 border-b border-[#2a3448] flex items-center gap-2.5">
                <div className="w-8 h-8 bg-[#6c63ff] rounded-lg flex items-center justify-center text-white">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" fill="rgba(255,255,255,0.12)" />
                        <path d="M8 12c0-2.21 1.79-4 4-4s4 1.79 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        <circle cx="12" cy="15" r="2" fill="currentColor" />
                        <path d="M6 18c1.5-1.5 3.5-2.5 6-2.5s4.5 1 6 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
                    </svg>
                </div>
                <div>
                    <div className="font-bold text-sm leading-tight text-slate-100">Voice Agent</div>
                    <div className="text-[10px] text-slate-400">Med Spa AI</div>
                </div>
            </div>

            <div className="py-4 flex-1 overflow-y-auto">
                <div className="px-4 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Overview</div>
                <NavItem to="/" icon={<BarChart3 className="w-4 h-4" />} label="Dashboard" active={isActive("/")} />
                <NavItem to="/calendar" icon={<Calendar className="w-4 h-4" />} label="Calendar" active={isActive("/calendar")} />

                <div className="px-4 pb-1 mt-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Configuration</div>
                <NavItem to="/settings/agent" icon={<Bot className="w-4 h-4" />} label="Agent Settings" active={isActive("/settings/agent")} />
                <NavItem to="/settings/models" icon={<Mic className="w-4 h-4" />} label="Models & Voice" active={isActive("/settings/models")} />
                <NavItem to="/settings/credentials" icon={<KeyRound className="w-4 h-4" />} label="API Credentials" active={isActive("/settings/credentials")} />

                <div className="px-4 pb-1 mt-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Data</div>
                <NavItem to="/logs" icon={<PhoneCall className="w-4 h-4" />} label="Call Logs" active={isActive("/logs")} />
                <NavItem to="/crm" icon={<Users className="w-4 h-4" />} label="CRM Contacts" active={isActive("/crm")} />
            </div>

            <div className="px-5 py-4 border-t border-[#2a3448] text-[11px] text-slate-400 flex items-center">
                <span className="inline-block w-[7px] h-[7px] rounded-full bg-green-500 mr-2 shadow-[0_0_6px_#22c55e] animate-pulse"></span>
                Agent Online
            </div>
        </nav>
    );
}

function NavItem({ to, icon, label, active }: { to: string, icon: React.ReactNode, label: string, active: boolean }) {
    return (
        <Link
            to={to}
            className={`flex items-center gap-2.5 py-2.5 px-5 cursor-pointer text-[13.5px] font-medium border-l-4 transition-all select-none
        ${active
                    ? "text-[#6c63ff] border-[#6c63ff] bg-[#6c63ff]/10"
                    : "text-slate-400 border-transparent hover:text-slate-100 hover:bg-white/5"
                }`}
        >
            <span className="w-5 text-center">{icon}</span>
            {label}
        </Link>
    );
}
