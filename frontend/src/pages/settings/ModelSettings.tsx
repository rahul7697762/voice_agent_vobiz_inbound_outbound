import { useEffect, useState } from "react";
import { fetchConfig, saveConfig } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function ModelSettings() {
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
                llm_model: config.llm_model,
                tts_voice: config.tts_voice,
                tts_language: config.tts_language,
            });
            toast.success("Model settings saved successfully");
        } catch (e) {
            toast.error("Failed to save model settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-slate-400">Loading settings...</div>;

    return (
        <div className="p-8 pb-24 max-w-4xl mx-auto relative min-h-full">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Models & Voice</h1>
                <p className="text-sm text-slate-500 mt-1">Select the LLM brain and TTS voice persona</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
                <h2 className="text-[14px] font-semibold mb-4 pb-3 border-b border-slate-200 text-slate-800">Language Model (LLM)</h2>
                <div className="space-y-2 max-w-[360px]">
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">OpenAI Model</Label>
                    <Select value={config.llm_model} onValueChange={(v: string) => setConfig({ ...config, llm_model: v })}>
                        <SelectTrigger className="bg-white border-slate-200 text-slate-900 focus:ring-[#6c63ff] shadow-sm">
                            <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 text-slate-900">
                            <SelectItem value="gpt-4o-mini">gpt-4o-mini — Fast & Cheap (Default)</SelectItem>
                            <SelectItem value="gpt-4o">gpt-4o — Balanced</SelectItem>
                            <SelectItem value="gpt-4.1">gpt-4.1 — Latest (Recommended)</SelectItem>
                            <SelectItem value="gpt-4.1-mini">gpt-4.1-mini — Fast & Latest</SelectItem>
                            <SelectItem value="gpt-4.5-preview">gpt-4.5-preview — Most Capable</SelectItem>
                            <SelectItem value="o4-mini">o4-mini — Reasoning, Fast</SelectItem>
                            <SelectItem value="o3">o3 — Reasoning, Best</SelectItem>
                            <SelectItem value="gpt-4-turbo">gpt-4-turbo — Legacy</SelectItem>
                            <SelectItem value="gpt-3.5-turbo">gpt-3.5-turbo — Cheapest</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
                <h2 className="text-[14px] font-semibold mb-4 pb-3 border-b border-slate-200 text-slate-800">Voice Synthesis (Sarvam bulbul:v3)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[720px]">
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Speaker Voice</Label>
                        <Select value={config.tts_voice} onValueChange={(v: string) => setConfig({ ...config, tts_voice: v })}>
                            <SelectTrigger className="bg-white border-slate-200 text-slate-900 focus:ring-[#6c63ff] shadow-sm">
                                <SelectValue placeholder="Select a voice" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-slate-200 text-slate-900">
                                <SelectItem value="kavya">Kavya — Female, Friendly</SelectItem>
                                <SelectItem value="rohan">Rohan — Male, Balanced</SelectItem>
                                <SelectItem value="priya">Priya — Female, Warm</SelectItem>
                                <SelectItem value="shubh">Shubh — Male, Formal</SelectItem>
                                <SelectItem value="shreya">Shreya — Female, Clear</SelectItem>
                                <SelectItem value="ritu">Ritu — Female, Soft</SelectItem>
                                <SelectItem value="rahul">Rahul — Male, Deep</SelectItem>
                                <SelectItem value="amit">Amit — Male, Casual</SelectItem>
                                <SelectItem value="neha">Neha — Female, Energetic</SelectItem>
                                <SelectItem value="dev">Dev — Male, Professional</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Language</Label>
                        <Select value={config.tts_language} onValueChange={(v: string) => setConfig({ ...config, tts_language: v })}>
                            <SelectTrigger className="bg-white border-slate-200 text-slate-900 focus:ring-[#6c63ff] shadow-sm">
                                <SelectValue placeholder="Select a language" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-slate-200 text-slate-900">
                                <SelectItem value="hi-IN">Hindi (hi-IN)</SelectItem>
                                <SelectItem value="en-IN">English India (en-IN)</SelectItem>
                                <SelectItem value="ta-IN">Tamil (ta-IN)</SelectItem>
                                <SelectItem value="te-IN">Telugu (te-IN)</SelectItem>
                                <SelectItem value="kn-IN">Kannada (kn-IN)</SelectItem>
                                <SelectItem value="ml-IN">Malayalam (ml-IN)</SelectItem>
                                <SelectItem value="mr-IN">Marathi (mr-IN)</SelectItem>
                                <SelectItem value="gu-IN">Gujarati (gu-IN)</SelectItem>
                                <SelectItem value="bn-IN">Bengali (bn-IN)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div >
            </div >

            <div className="fixed bottom-0 left-60 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] px-8 py-4 flex items-center justify-end z-20">
                <Button onClick={handleSave} disabled={saving} className="bg-[#6c63ff] hover:bg-[#5a52e0] text-white">
                    {saving ? "Saving..." : "💾 Save Model Settings"}
                </Button>
            </div>
        </div >
    );
}
