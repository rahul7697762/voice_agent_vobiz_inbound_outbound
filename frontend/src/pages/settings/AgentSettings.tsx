import { useEffect, useState } from "react";
import { fetchConfig, saveConfig } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AgentSettings() {
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
                first_line: config.first_line,
                agent_instructions: config.agent_instructions,
                stt_min_endpointing_delay: parseFloat(config.stt_min_endpointing_delay),
            });
            toast.success("Agent settings saved successfully");
        } catch (e) {
            toast.error("Failed to save agent settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-slate-400">Loading settings...</div>;

    return (
        <div className="p-8 pb-24 max-w-4xl mx-auto relative min-h-full">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Agent Settings</h1>
                <p className="text-sm text-slate-500 mt-1">Configure AI personality, opening line, and sensitivity</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
                <h2 className="text-[14px] font-semibold mb-4 pb-3 border-b border-slate-200 text-slate-800">Opening Greeting</h2>
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">First Line (What the agent says when a call connects)</Label>
                    <Input
                        value={config.first_line || ""}
                        onChange={(e: any) => setConfig({ ...config, first_line: e.target.value })}
                        className="bg-white border-slate-200 focus-visible:ring-[#6c63ff] text-slate-900 shadow-sm"
                        placeholder="Namaste! Welcome to Daisy's Med Spa..."
                    />
                    <p className="text-[11.5px] text-slate-500">This is the very first thing the agent says. Keep it concise and warm.</p>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
                <h2 className="text-[14px] font-semibold mb-4 pb-3 border-b border-slate-200 text-slate-800">System Prompt</h2>
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Master System Prompt</Label>
                    <Textarea
                        rows={12}
                        value={config.agent_instructions || ""}
                        onChange={(e: any) => setConfig({ ...config, agent_instructions: e.target.value })}
                        className="bg-white border-slate-200 focus-visible:ring-[#6c63ff] font-mono text-xs text-slate-900 shadow-sm"
                        placeholder="Enter the AI's full personality and instructions..."
                    />
                    <p className="text-[11.5px] text-slate-500">Date and time context are injected automatically. Do not hardcode today's date.</p>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
                <h2 className="text-[14px] font-semibold mb-4 pb-3 border-b border-slate-200 text-slate-800">Listening Sensitivity</h2>
                <div className="space-y-2 max-w-[220px]">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Endpointing Delay (seconds)</Label>
                    <Input
                        type="number"
                        step="0.05" min="0.1" max="3.0"
                        value={config.stt_min_endpointing_delay || 0.6}
                        onChange={(e: any) => setConfig({ ...config, stt_min_endpointing_delay: e.target.value })}
                        className="bg-white border-slate-200 focus-visible:ring-[#6c63ff] text-slate-900 shadow-sm"
                    />
                    <p className="text-[11.5px] text-slate-500">Seconds the AI waits after silence before responding. Default: 0.6</p>
                </div>
            </div>

            <div className="fixed bottom-0 left-60 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] px-8 py-4 flex items-center justify-end z-20">
                <Button onClick={handleSave} disabled={saving} className="bg-[#6c63ff] hover:bg-[#5a52e0] text-white">
                    {saving ? "Saving..." : "💾 Save Agent Settings"}
                </Button>
            </div>
        </div>
    );
}
