import { useEffect, useState } from "react";
import { fetchConfig, saveConfig } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ApiCredentials() {
    const [config, setConfig] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchConfig().then(data => {
            setConfig(data);
            setLoading(false);
        });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await saveConfig({
                livekit_url: config.livekit_url,
                sip_trunk_id: config.sip_trunk_id,
                livekit_api_key: config.livekit_api_key,
                livekit_api_secret: config.livekit_api_secret,
                openai_api_key: config.openai_api_key,
                sarvam_api_key: config.sarvam_api_key,
                cal_api_key: config.cal_api_key,
                cal_event_type_id: config.cal_event_type_id,
                telegram_bot_token: config.telegram_bot_token,
                telegram_chat_id: config.telegram_chat_id,
                supabase_url: config.supabase_url,
                supabase_key: config.supabase_key,
                vobiz_auth_id: config.vobiz_auth_id,
                vobiz_auth_token: config.vobiz_auth_token,
            });
            toast.success("Credentials saved successfully");
        } catch (e) {
            toast.error("Failed to save credentials");
        } finally {
            setSaving(false);
        }
    };

    const updateField = (field: string, value: string) => {
        setConfig({ ...config, [field]: value });
    };

    if (loading) return <div className="p-8 text-slate-400">Loading credentials...</div>;

    return (
        <div className="p-8 pb-24 max-w-5xl mx-auto relative min-h-full">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">API Credentials</h1>
                <p className="text-sm text-slate-500 mt-1">Credentials here override .env values at runtime. Never share this page.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
                <h2 className="text-[14px] font-semibold mb-4 pb-3 border-b border-slate-200 text-slate-800">LiveKit</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="LiveKit URL" value={config.livekit_url} onChange={v => updateField("livekit_url", v)} />
                    <Field label="SIP Trunk ID" value={config.sip_trunk_id} onChange={v => updateField("sip_trunk_id", v)} />
                    <Field label="API Key" type="password" value={config.livekit_api_key} onChange={v => updateField("livekit_api_key", v)} />
                    <Field label="API Secret" type="password" value={config.livekit_api_secret} onChange={v => updateField("livekit_api_secret", v)} />
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
                <h2 className="text-[14px] font-semibold mb-4 pb-3 border-b border-slate-200 text-slate-800">AI Providers</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="OpenAI API Key" type="password" value={config.openai_api_key} onChange={v => updateField("openai_api_key", v)} />
                    <Field label="Sarvam API Key" type="password" value={config.sarvam_api_key} onChange={v => updateField("sarvam_api_key", v)} />
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
                <h2 className="text-[14px] font-semibold mb-4 pb-3 border-b border-slate-200 text-slate-800">Integrations</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="Cal.com API Key" type="password" value={config.cal_api_key} onChange={v => updateField("cal_api_key", v)} />
                    <Field label="Cal.com Event Type ID" value={config.cal_event_type_id} onChange={v => updateField("cal_event_type_id", v)} />
                    <Field label="Telegram Bot Token" type="password" value={config.telegram_bot_token} onChange={v => updateField("telegram_bot_token", v)} />
                    <Field label="Telegram Chat ID" value={config.telegram_chat_id} onChange={v => updateField("telegram_chat_id", v)} />
                    <Field label="Supabase URL" value={config.supabase_url} onChange={v => updateField("supabase_url", v)} />
                    <Field label="Supabase Anon Key" type="password" value={config.supabase_key} onChange={v => updateField("supabase_key", v)} />
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
                <h2 className="text-[14px] font-semibold mb-1 text-slate-800 flex items-center gap-2">
                    📞 Vobiz <span className="text-[10px] font-medium bg-[#6c63ff]/10 text-[#6c63ff] px-2 py-0.5 rounded-full">Phone Numbers</span>
                </h2>
                <p className="text-[11.5px] text-slate-500 mb-4 pb-3 border-b border-slate-200">
                    Used to search and purchase phone numbers from your Vobiz account.
                    Get your credentials from <a href="https://vobiz.ai" target="_blank" rel="noreferrer" className="text-[#6c63ff] hover:underline">vobiz.ai</a>.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="X-Auth-ID" value={config.vobiz_auth_id} onChange={v => updateField("vobiz_auth_id", v)} />
                    <Field label="X-Auth-Token" type="password" value={config.vobiz_auth_token} onChange={v => updateField("vobiz_auth_token", v)} />
                </div>
            </div>

            <div className="fixed bottom-0 left-60 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] px-8 py-4 flex items-center justify-end z-20">
                <Button onClick={handleSave} disabled={saving} className="bg-[#6c63ff] hover:bg-[#5a52e0] text-white">
                    {saving ? "Saving..." : "💾 Save Credentials"}
                </Button>
            </div>
        </div>
    );
}

function Field({ label, value, type = "text", onChange }: { label: string, value: string, type?: string, onChange: (v: string) => void }) {
    return (
        <div className="space-y-2">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</Label>
            <Input
                type={type}
                value={value || ""}
                onChange={(e: any) => onChange(e.target.value)}
                className="bg-white border-slate-200 focus-visible:ring-[#6c63ff] text-slate-900 shadow-sm"
            />
        </div>
    );
}
