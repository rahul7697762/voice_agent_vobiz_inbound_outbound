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
                <h1 className="text-2xl font-bold text-slate-100">API Credentials</h1>
                <p className="text-sm text-slate-400 mt-1">Credentials here override .env values at runtime. Never share this page.</p>
            </div>

            <div className="bg-[#1c2333] border border-[#2a3448] rounded-xl p-6 mb-6">
                <h2 className="text-[14px] font-semibold mb-4 pb-3 border-b border-[#2a3448] text-slate-200">LiveKit</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="LiveKit URL" value={config.livekit_url} onChange={v => updateField("livekit_url", v)} />
                    <Field label="SIP Trunk ID" value={config.sip_trunk_id} onChange={v => updateField("sip_trunk_id", v)} />
                    <Field label="API Key" type="password" value={config.livekit_api_key} onChange={v => updateField("livekit_api_key", v)} />
                    <Field label="API Secret" type="password" value={config.livekit_api_secret} onChange={v => updateField("livekit_api_secret", v)} />
                </div>
            </div>

            <div className="bg-[#1c2333] border border-[#2a3448] rounded-xl p-6 mb-6">
                <h2 className="text-[14px] font-semibold mb-4 pb-3 border-b border-[#2a3448] text-slate-200">AI Providers</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="OpenAI API Key" type="password" value={config.openai_api_key} onChange={v => updateField("openai_api_key", v)} />
                    <Field label="Sarvam API Key" type="password" value={config.sarvam_api_key} onChange={v => updateField("sarvam_api_key", v)} />
                </div>
            </div>

            <div className="bg-[#1c2333] border border-[#2a3448] rounded-xl p-6 mb-6">
                <h2 className="text-[14px] font-semibold mb-4 pb-3 border-b border-[#2a3448] text-slate-200">Integrations</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="Cal.com API Key" type="password" value={config.cal_api_key} onChange={v => updateField("cal_api_key", v)} />
                    <Field label="Cal.com Event Type ID" value={config.cal_event_type_id} onChange={v => updateField("cal_event_type_id", v)} />
                    <Field label="Telegram Bot Token" type="password" value={config.telegram_bot_token} onChange={v => updateField("telegram_bot_token", v)} />
                    <Field label="Telegram Chat ID" value={config.telegram_chat_id} onChange={v => updateField("telegram_chat_id", v)} />
                    <Field label="Supabase URL" value={config.supabase_url} onChange={v => updateField("supabase_url", v)} />
                    <Field label="Supabase Anon Key" type="password" value={config.supabase_key} onChange={v => updateField("supabase_key", v)} />
                </div>
            </div>

            <div className="fixed bottom-0 left-60 right-0 bg-[#161b27]/95 backdrop-blur-md border-t border-[#2a3448] px-8 py-4 flex items-center justify-end z-20">
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
            <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</Label>
            <Input
                type={type}
                value={value || ""}
                onChange={(e: any) => onChange(e.target.value)}
                className="bg-[#0f1117] border-[#2a3448] focus-visible:ring-[#6c63ff] text-slate-200"
            />
        </div>
    );
}
