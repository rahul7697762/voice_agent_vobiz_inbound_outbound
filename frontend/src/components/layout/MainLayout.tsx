import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function MainLayout() {
    return (
        <div className="flex h-screen overflow-hidden bg-[#0f1117] text-slate-200 font-sans">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
}
