import React, { useState, useEffect } from 'react';
import {
    LiveKitRoom,
    RoomAudioRenderer,
    BarVisualizer,
    useVoiceAssistant,
} from '@livekit/components-react';
import '@livekit/components-styles';

type Agent = {
    id: string;
    name: string;
    agent_type: string;
    description: string;
    tts_voice: string;
    tts_language: string;
    llm_model: string;
    first_line: string;
    agent_instructions: string;
    created_at: string;
};

type CreateAgentForm = {
    name: string;
    agent_type: string;
    description: string;
    tts_voice: string;
    tts_language: string;
    llm_model: string;
    first_line: string;
    agent_instructions: string;
};

const DEFAULT_FORM: CreateAgentForm = {
    name: '',
    agent_type: 'Conversation Flow',
    description: '',
    tts_voice: 'kavya',
    tts_language: 'hi-IN',
    llm_model: 'gpt-4o-mini',
    first_line: '',
    agent_instructions: '',
};

export default function UserDashboard() {
    const [agents, setAgents] = useState<Agent[]>([]);

    // Create Agent Modal State
    const [showModal, setShowModal] = useState(false);
    const [step, setStep] = useState(1);
    const [form, setForm] = useState<CreateAgentForm>(DEFAULT_FORM);
    const [creating, setCreating] = useState(false);
    const [createResult, setCreateResult] = useState<{ success: boolean; message: string } | null>(null);
    const [showNPS, setShowNPS] = useState(true);

    // Test Agent Modal State
    const [showTestModal, setShowTestModal] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [testToken, setTestToken] = useState<string>('');
    const [testUrl, setTestUrl] = useState<string>('');
    const [connectingClient, setConnectingClient] = useState(false);

    useEffect(() => {
        fetchAgents();
    }, []);

    const fetchAgents = async () => {
        try {
            const res = await fetch(`/api/agents`);
            if (res.ok) setAgents(await res.json());
        } catch (_) { }
    };

    const openTestModal = async (agent: Agent) => {
        setSelectedAgent(agent);
        setConnectingClient(true);
        setShowTestModal(true);
        try {
            const res = await fetch(`/api/agent/token?participant_name=user&room_name=${encodeURIComponent(agent.id)}`);
            const data = await res.json();
            if (res.ok && data.token) {
                setTestToken(data.token);
                setTestUrl(data.livekit_url);
            } else {
                alert("Failed to get token for testing.");
                setShowTestModal(false);
            }
        } catch (e) {
            alert("Error connecting to LiveKit.");
            setShowTestModal(false);
        } finally {
            setConnectingClient(false);
        }
    };

    const closeTestModal = () => {
        setShowTestModal(false);
        setSelectedAgent(null);
        setTestToken('');
        setTestUrl('');
    };

    const openModal = () => {
        setForm(DEFAULT_FORM);
        setStep(1);
        setCreateResult(null);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setCreateResult(null);
        setStep(1);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleCreate = async () => {
        if (!form.name.trim()) {
            setCreateResult({ success: false, message: 'Agent name is required.' });
            return;
        }
        setCreating(true);
        setCreateResult(null);
        try {
            const res = await fetch(`/api/agents/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (res.ok && data.status === 'success') {
                setAgents(prev => [data.agent, ...prev.filter(a => a.name !== data.agent.name)]);
                const warning = data.livekit_warning ? ` (Note: ${data.livekit_warning})` : '';
                setCreateResult({ success: true, message: `Agent "${data.agent.name}" created successfully!${warning}` });
                setStep(4); // success step
            } else {
                setCreateResult({ success: false, message: data.detail || 'Failed to create agent.' });
            }
        } catch (e) {
            setCreateResult({ success: false, message: 'Network error. Is the backend running?' });
        } finally {
            setCreating(false);
        }
    };

    const STEP_LABELS = ['Basic Details', 'Voice & Model', 'Prompt'];

    return (
        <>
            <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .material-symbols-rounded { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); backdrop-filter: blur(6px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 16px; }
        .modal-box { background: white; border-radius: 20px; width: 100%; max-width: 520px; box-shadow: 0 24px 60px rgba(0,0,0,0.2); overflow: hidden; }
        .wizard-step-bar { display: flex; gap: 6px; padding: 20px 24px 0; }
        .wizard-step-seg { flex: 1; height: 4px; border-radius: 9px; background: #e5e7eb; transition: background 0.3s; }
        .wizard-step-seg.active { background: #2563eb; }
        input, textarea, select { width: 100%; border: 1.5px solid #e5e7eb; border-radius: 10px; padding: 9px 12px; font-size: 13px; font-family: inherit; outline: none; transition: border-color 0.2s; background: white; }
        input:focus, textarea:focus, select:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        textarea { resize: vertical; }
        label { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 5px; display: block; }
        .form-group { margin-bottom: 16px; }
        .hint { font-size: 11px; color: #9ca3af; margin-top: 4px; }
      `}</style>

            <div className="bg-[#f9fafb] text-slate-900 min-h-screen flex flex-col font-sans w-full absolute inset-0 z-[100] m-0 p-0 overflow-y-auto">

                {/* Header */}
                <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between lg:pl-72">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#2563eb] rounded-lg flex items-center justify-center text-white font-bold text-sm lg:hidden">R</div>
                        <h1 className="text-lg font-semibold tracking-tight">All Agents</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors cursor-pointer" aria-label="Search">
                            <span className="material-symbols-rounded">search</span>
                        </button>
                        <button
                            onClick={openModal}
                            className="bg-[#2563eb] text-white p-2 rounded-full shadow-lg shadow-[#2563eb]/20 flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors"
                            aria-label="Create an Agent"
                        >
                            <span className="material-symbols-rounded">add</span>
                        </button>
                    </div>
                </header>

                {/* Main */}
                <main className="flex-1 flex flex-col pb-24 w-full lg:w-[calc(100%-256px)] lg:ml-64">
                    {/* Filter pills */}
                    <div className="px-4 py-4">
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                            <button className="px-4 py-1.5 bg-[#2563eb] text-white text-sm font-medium rounded-full shrink-0 cursor-pointer">All Agents</button>
                            <button className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-full shrink-0 cursor-pointer">Recent</button>
                            <button className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-full shrink-0 cursor-pointer">Active</button>
                            <button className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-full shrink-0 cursor-pointer">Drafts</button>
                        </div>
                    </div>

                    {/* Agent cards */}
                    <div className="px-4 space-y-3">
                        {agents.length === 0 ? (
                            // Default seeded card (the existing placeholder)
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-3">
                                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-[#2563eb]">
                                            <span className="material-symbols-rounded text-3xl">smart_toy</span>
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900">Conversation Flow Agent</h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500">Conversation Flow</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="text-slate-400 cursor-pointer"><span className="material-symbols-rounded">more_vert</span></button>
                                </div>
                                <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-50">
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-slate-400 uppercase font-medium">Voice</p>
                                        <div className="flex items-center gap-2">
                                            <img alt="Climo" className="w-5 h-5 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuADhC1AL0oiixrKl19TVzZ4qSQtC0K2k6zRPmD935rSHQf2Ku9iZS7sDHd5Unv0ImZteCSU3w5cYM_HXMEkvDYryQerOOywgs-U6380MPOg-t-4mjCcA9Ns1SWQqFdbiZEmK7MCgnr17G7RgiXNkXvRS-pB3BMNmhPkRZAXRsP0rANfGDv66aqSo7vlICjXyIC4ODWA_DoVgvhVVs2WXnFczWNUDvkNAekmEOpLxUJflu2rI02LhBg4hPEaFdvRdAyBbZ3ZYbQFlBu6" />
                                            <span className="text-xs font-medium text-slate-600">Climo</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-slate-400 uppercase font-medium">Edited By</p>
                                        <p className="text-xs font-medium text-slate-600">10/08/2025</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="flex-1 py-2 bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer hover:bg-slate-100">View Analytics</button>
                                    <button className="flex-1 py-2 bg-[#2563eb] text-white text-xs font-semibold rounded-lg cursor-pointer hover:bg-blue-700">Manage</button>
                                </div>
                            </div>
                        ) : (
                            agents.map(agent => (
                                <div key={agent.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex gap-3">
                                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-[#2563eb]">
                                                <span className="material-symbols-rounded text-3xl">smart_toy</span>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-900">{agent.name}</h3>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500">{agent.agent_type}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button className="text-slate-400 cursor-pointer"><span className="material-symbols-rounded">more_vert</span></button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-50">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-slate-400 uppercase font-medium">Voice</p>
                                            <p className="text-xs font-medium text-slate-600 capitalize">{agent.tts_voice} ({agent.tts_language})</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-slate-400 uppercase font-medium">Created</p>
                                            <p className="text-xs font-medium text-slate-600">{agent.created_at}</p>
                                        </div>
                                    </div>
                                    <div className="p-2 -mx-2 -mt-2 mb-1 bg-amber-50/50 rounded-lg flex items-center gap-2 border border-amber-100/50">
                                        <span className="material-symbols-rounded text-amber-500 text-sm">warning</span>
                                        <p className="text-[10px] text-slate-600 font-medium">Assign a Vobiz phone number to make real calls.</p>
                                    </div>
                                    <div className="flex gap-2 mt-auto">
                                        <button
                                            onClick={() => openTestModal(agent)}
                                            className="flex-1 py-2 flex items-center justify-center gap-1.5 bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer hover:bg-slate-100 border border-slate-200 transition-colors"
                                        >
                                            <span className="material-symbols-rounded text-sm">record_voice_over</span> Test Agent
                                        </button>
                                        <button className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#2563eb] text-white text-xs font-semibold rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                                            Connect Phone
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}

                        {/* Create CTA card */}
                        <div
                            onClick={openModal}
                            className="py-12 flex flex-col items-center justify-center text-center px-8 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                                <span className="material-symbols-rounded">add_circle</span>
                            </div>
                            <h4 className="font-medium text-slate-900">Create your next agent</h4>
                            <p className="text-xs text-slate-500 mt-1">Scale your business with specialized AI voice bots.</p>
                        </div>
                    </div>

                    {/* NPS Card */}
                    {showNPS && (
                        <div className="mt-8 px-4 w-full">
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2">
                                    <button onClick={() => setShowNPS(false)} className="text-slate-300 cursor-pointer hover:text-slate-500">
                                        <span className="material-symbols-rounded text-lg">close</span>
                                    </button>
                                </div>
                                <div className="flex gap-4 items-center mb-4">
                                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-500">
                                        <span className="material-symbols-rounded text-2xl">star_rate</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">How likely are you to recommend us?</p>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Your feedback matters</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center gap-1.5 mb-2">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                        <button key={num} onClick={() => setShowNPS(false)} className="w-full aspect-square text-[10px] font-bold rounded-lg border border-slate-100 hover:bg-[#2563eb] hover:text-white transition-colors cursor-pointer">{num}</button>
                                    ))}
                                </div>
                                <div className="flex justify-between px-1">
                                    <span className="text-[9px] uppercase font-bold text-slate-400">Not Likely</span>
                                    <span className="text-[9px] uppercase font-bold text-slate-400">Extremely</span>
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {/* Bottom Nav (mobile) */}
                <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-white/90 backdrop-blur-lg border-t border-slate-200 flex justify-around items-center px-4 py-2 pb-6 z-50">
                    <button className="flex flex-col items-center gap-1 text-[#2563eb] cursor-pointer">
                        <span className="material-symbols-rounded">dashboard</span>
                        <span className="text-[10px] font-medium">Agents</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 text-slate-400 cursor-pointer">
                        <span className="material-symbols-rounded">phone_forwarded</span>
                        <span className="text-[10px] font-medium">Batch</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 text-slate-400 cursor-pointer">
                        <span className="material-symbols-rounded">analytics</span>
                        <span className="text-[10px] font-medium">Metrics</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 text-slate-400 cursor-pointer">
                        <span className="material-symbols-rounded">settings</span>
                        <span className="text-[10px] font-medium">Settings</span>
                    </button>
                    <button onClick={openModal} className="flex flex-col items-center gap-1 text-slate-400 cursor-pointer">
                        <span className="material-symbols-rounded">account_circle</span>
                        <span className="text-[10px] font-medium">Account</span>
                    </button>
                </nav>

                {/* Desktop Sidebar */}
                <div className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-slate-50 border-r border-slate-200 p-6 flex-col gap-8 z-40">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#2563eb] rounded-lg flex items-center justify-center text-white font-bold text-sm">R</div>
                        <span className="font-bold text-slate-900">Workspace</span>
                    </div>
                    <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar w-full">
                        <div>
                            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3">Build</p>
                            <div className="space-y-1">
                                <a className="flex items-center gap-3 px-3 py-2 bg-white rounded-lg text-[#2563eb] shadow-sm ring-1 ring-slate-200" href="#">
                                    <span className="material-symbols-rounded text-xl">smart_toy</span>
                                    <span className="text-sm font-semibold">Agents</span>
                                </a>
                                <a className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" href="#">
                                    <span className="material-symbols-rounded text-xl">menu_book</span>
                                    <span className="text-sm font-medium">Knowledge Base</span>
                                </a>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3">Deploy</p>
                            <div className="space-y-1">
                                <a className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" href="#">
                                    <span className="material-symbols-rounded text-xl">tag</span>
                                    <span className="text-sm font-medium">Phone Numbers</span>
                                </a>
                                <a className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" href="#">
                                    <span className="material-symbols-rounded text-xl">phone_forwarded</span>
                                    <span className="text-sm font-medium">Batch Call</span>
                                </a>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3">Monitor</p>
                            <div className="space-y-1">
                                <a className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" href="#">
                                    <span className="material-symbols-rounded text-xl">history</span>
                                    <span className="text-sm font-medium">Call History</span>
                                </a>
                                <a className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" href="#">
                                    <span className="material-symbols-rounded text-xl">forum</span>
                                    <span className="text-sm font-medium">Chat History</span>
                                </a>
                                <a className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" href="#">
                                    <span className="material-symbols-rounded text-xl">analytics</span>
                                    <span className="text-sm font-medium">Analytics</span>
                                </a>
                                <a className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" href="#">
                                    <span className="material-symbols-rounded text-xl">notifications</span>
                                    <span className="text-sm font-medium">Alerting</span>
                                </a>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-3">System</p>
                            <div className="space-y-1">
                                <a className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" href="#">
                                    <span className="material-symbols-rounded text-xl">credit_card</span>
                                    <span className="text-sm font-medium">Billing</span>
                                </a>
                                <a className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" href="#">
                                    <span className="material-symbols-rounded text-xl">settings</span>
                                    <span className="text-sm font-medium">Settings</span>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="mt-auto pt-6 border-t border-slate-200 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                                <img alt="Rahul" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBVmz4DUayI8Z0lS4ViHtnbBtwcMFVpJdfTswKeCSOHMDTx4TAtBjqXCgokcvPmXRph1sz0uALTtrJasKcXQXtgLuuayBHIMYEE0JkShKNYO7HrbWbIgw7pfiOmM-DPDvi4WlRehAqfKR8pxcKAVZswqIuExiaAD5VRAno-3Bqqlk7if5Lddv5gHO4ENCVyRYKEEnDQI6atvmdwejDhj9bYxx0S0os_BinUcEdwv5jY8-9M8HkdYf25L6xZJJo9ZapqlvwLEqblmnRu" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold truncate">Rahul Saini</p>
                                <p className="text-[10px] text-slate-500 truncate">Free Trial</p>
                            </div>
                        </div>
                    </div>
                    {/* Sidebar Create button */}
                    <button
                        onClick={openModal}
                        className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#2563eb] text-white text-sm font-semibold rounded-xl cursor-pointer hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <span className="material-symbols-rounded text-xl">add</span>
                        Create an Agent
                    </button>
                </div>
            </div>

            {/* ── Create Agent Modal ── */}
            {showModal && (
                <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
                    <div className="modal-box">
                        {/* Progress bar */}
                        {step < 4 && (
                            <div className="wizard-step-bar">
                                {STEP_LABELS.map((_, i) => (
                                    <div key={i} className={`wizard-step-seg ${step > i ? 'active' : ''}`} />
                                ))}
                            </div>
                        )}

                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 pt-5 pb-2">
                            {step < 4 ? (
                                <div>
                                    <p className="text-[11px] font-bold text-[#2563eb] uppercase tracking-wider">Step {step} of 3</p>
                                    <h2 className="text-lg font-bold text-slate-900 mt-0.5">{STEP_LABELS[step - 1]}</h2>
                                </div>
                            ) : (
                                <h2 className="text-lg font-bold text-slate-900">
                                    {createResult?.success ? '🎉 Agent Created!' : '❌ Creation Failed'}
                                </h2>
                            )}
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors">
                                <span className="material-symbols-rounded">close</span>
                            </button>
                        </div>

                        {/* Step Body */}
                        <div className="px-6 pb-4 overflow-y-auto max-h-[60vh]">
                            {step === 1 && (
                                <>
                                    <div className="form-group">
                                        <label>Agent Name *</label>
                                        <input name="name" value={form.name} onChange={handleFormChange} placeholder="e.g., Sales Concierge" autoFocus />
                                    </div>
                                    <div className="form-group">
                                        <label>Agent Type</label>
                                        <select name="agent_type" value={form.agent_type} onChange={handleFormChange}>
                                            <option value="Conversation Flow">Conversation Flow</option>
                                            <option value="Information Retrieval">Information Retrieval</option>
                                            <option value="Outbound Sales">Outbound Sales</option>
                                            <option value="Inbound Support">Inbound Support</option>
                                            <option value="Appointment Booking">Appointment Booking</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Description <span className="normal-case font-normal text-slate-400">(optional)</span></label>
                                        <textarea name="description" value={form.description} onChange={handleFormChange} rows={3} placeholder="What does this agent do?" />
                                    </div>
                                </>
                            )}

                            {step === 2 && (
                                <>
                                    <div className="form-group">
                                        <label>Speaker Voice</label>
                                        <select name="tts_voice" value={form.tts_voice} onChange={handleFormChange}>
                                            <option value="kavya">Kavya — Female, Friendly</option>
                                            <option value="rohan">Rohan — Male, Balanced</option>
                                            <option value="priya">Priya — Female, Warm</option>
                                            <option value="shubh">Shubh — Male, Formal</option>
                                            <option value="shreya">Shreya — Female, Clear</option>
                                            <option value="ritu">Ritu — Female, Soft</option>
                                            <option value="rahul">Rahul — Male, Deep</option>
                                            <option value="amit">Amit — Male, Casual</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Language</label>
                                        <select name="tts_language" value={form.tts_language} onChange={handleFormChange}>
                                            <option value="hi-IN">Hindi (hi-IN)</option>
                                            <option value="en-IN">English India (en-IN)</option>
                                            <option value="ta-IN">Tamil (ta-IN)</option>
                                            <option value="te-IN">Telugu (te-IN)</option>
                                            <option value="kn-IN">Kannada (kn-IN)</option>
                                            <option value="ml-IN">Malayalam (ml-IN)</option>
                                            <option value="mr-IN">Marathi (mr-IN)</option>
                                            <option value="gu-IN">Gujarati (gu-IN)</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>LLM Model</label>
                                        <select name="llm_model" value={form.llm_model} onChange={handleFormChange}>
                                            <option value="gpt-4o-mini">gpt-4o-mini — Fast & Cheap</option>
                                            <option value="gpt-4o">gpt-4o — Balanced</option>
                                            <option value="gpt-4.1">gpt-4.1 — Latest</option>
                                            <option value="gpt-4.1-mini">gpt-4.1-mini — Fast & Latest</option>
                                            <option value="gpt-4-turbo">gpt-4-turbo — Legacy</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {step === 3 && (
                                <>
                                    <div className="form-group">
                                        <label>Opening Line</label>
                                        <input name="first_line" value={form.first_line} onChange={handleFormChange} placeholder="Namaste! Welcome to..." />
                                        <p className="hint">The very first thing the agent says when a call connects.</p>
                                    </div>
                                    <div className="form-group">
                                        <label>System Instructions</label>
                                        <textarea name="agent_instructions" value={form.agent_instructions} onChange={handleFormChange} rows={8} placeholder="You are Priya, a friendly sales concierge at..." />
                                        <p className="hint">Full personality and behavior instructions for this agent.</p>
                                    </div>
                                    {createResult && !createResult.success && (
                                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                                            {createResult.message}
                                        </div>
                                    )}
                                </>
                            )}

                            {step === 4 && createResult && (
                                <div className={`mt-2 p-4 rounded-xl border text-sm ${createResult.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                    {createResult.message}
                                </div>
                            )}
                        </div>

                        {/* Footer Buttons */}
                        <div className="px-6 pb-6 pt-2 flex items-center justify-between border-t border-slate-100 mt-2">
                            {step < 4 ? (
                                <>
                                    <button
                                        onClick={step === 1 ? closeModal : () => setStep(s => s - 1)}
                                        className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                                    >
                                        {step === 1 ? 'Cancel' : '← Back'}
                                    </button>
                                    {step < 3 ? (
                                        <button
                                            onClick={() => { if (step === 1 && !form.name.trim()) { setCreateResult({ success: false, message: 'Agent name is required.' }); return; } setCreateResult(null); setStep(s => s + 1); }}
                                            className="px-5 py-2 text-sm font-semibold bg-[#2563eb] text-white rounded-xl hover:bg-blue-700 cursor-pointer transition-colors"
                                        >
                                            Next →
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleCreate}
                                            disabled={creating}
                                            className="px-5 py-2 text-sm font-semibold bg-[#2563eb] text-white rounded-xl hover:bg-blue-700 cursor-pointer transition-colors disabled:opacity-60 flex items-center gap-2"
                                        >
                                            {creating ? (
                                                <><span className="material-symbols-rounded text-base animate-spin">refresh</span> Creating...</>
                                            ) : (
                                                <><span className="material-symbols-rounded text-base">rocket_launch</span> Create Agent</>
                                            )}
                                        </button>
                                    )}
                                </>
                            ) : (
                                <button onClick={closeModal} className="ml-auto px-5 py-2 text-sm font-semibold bg-[#2563eb] text-white rounded-xl hover:bg-blue-700 cursor-pointer transition-colors">
                                    Done ✓
                                </button>
                            )}
                        </div>
                        {/* Inline name validation on step 1 */}
                        {step === 1 && createResult && !createResult.success && (
                            <p className="px-6 pb-4 text-xs text-red-600 -mt-2">{createResult.message}</p>
                        )}
                    </div>
                </div>
            )}

            {/* ── Test Agent Modal (WebRTC) ── */}
            {showTestModal && selectedAgent && (
                <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeTestModal(); }}>
                    <div className="modal-box p-0 overflow-hidden flex flex-col bg-slate-900 border border-slate-700 shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
                                    <span className="material-symbols-rounded">record_voice_over</span>
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white leading-tight">Test: {selectedAgent.name}</h2>
                                    <p className="text-xs text-slate-400">Speak into your microphone</p>
                                </div>
                            </div>
                            <button onClick={closeTestModal} className="text-slate-400 hover:text-white cursor-pointer transition-colors p-1.5 rounded-lg hover:bg-slate-700">
                                <span className="material-symbols-rounded">close</span>
                            </button>
                        </div>

                        <div className="p-8 flex flex-col items-center justify-center min-h-[300px] relative">
                            {connectingClient ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                                    <p className="text-sm text-slate-300 font-medium tracking-wide animate-pulse">Connecting to LiveKit...</p>
                                </div>
                            ) : testToken && testUrl ? (
                                <LiveKitRoom
                                    serverUrl={testUrl}
                                    token={testToken}
                                    connect={true}
                                    audio={true}
                                    video={false}
                                    className="w-full flex-1 flex flex-col items-center justify-center gap-8"
                                >
                                    <RoomAudioRenderer />

                                    {/* Agent Visualizer */}
                                    <div className="w-32 h-32 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.15)] relative">
                                        <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" style={{ animationDuration: '3s' }}></div>
                                        <div className="h-16 w-16 text-blue-500">
                                            <span className="material-symbols-rounded text-6xl block">smart_toy</span>
                                        </div>
                                    </div>

                                    <div className="text-center space-y-2 mt-4">
                                        <p className="text-slate-300 text-sm font-medium bg-slate-800 py-2 px-6 rounded-full inline-block border border-slate-700">
                                            Status: <span className="text-green-400">Connected</span>
                                        </p>
                                        <p className="text-xs text-slate-500 block w-full max-w-sm mx-auto">
                                            Ensure your browser has microphone permissions allowed. The agent should greet you shortly.
                                        </p>
                                    </div>
                                </LiveKitRoom>
                            ) : (
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center text-red-400 mx-auto mb-3">
                                        <span className="material-symbols-rounded">error</span>
                                    </div>
                                    <p className="text-white font-medium">Failed to connect</p>
                                    <p className="text-xs text-slate-400 mt-1">Could not get LiveKit token.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
