import { useEffect, useState } from "react";
import { fetchLogs, getTranscriptUrl } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Download, Headphones } from "lucide-react";

export default function CallLogs() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const loadData = async () => {
        setLoading(true);
        setError(false);
        try {
            const logsData = await fetchLogs();
            setLogs(logsData || []);
        } catch (err) {
            console.error(err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const badgeFor = (summary: string) => {
        if (!summary) return <Badge variant="secondary" className="bg-white/10 text-slate-300 pointer-events-none">Ended</Badge>;
        const lower = summary.toLowerCase();
        if (lower.includes('confirm')) return <Badge className="bg-green-500/15 text-green-500 pointer-events-none hover:bg-green-500/25">✓ Booked</Badge>;
        if (lower.includes('cancel')) return <Badge className="bg-yellow-500/15 text-yellow-500 pointer-events-none hover:bg-yellow-500/25">✗ Cancelled</Badge>;
        return <Badge variant="secondary" className="bg-white/10 text-slate-300 pointer-events-none">Completed</Badge>;
    };

    return (
        <div className="p-8 pb-20 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Call Logs</h1>
                    <p className="text-sm text-slate-400 mt-1">Full history of all incoming calls and transcripts</p>
                </div>
                <Button variant="outline" onClick={loadData} disabled={loading} className="bg-transparent border-[#2a3448] text-slate-300 hover:bg-[#2a3448] hover:text-white">
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            <div className="bg-[#1c2333] border border-[#2a3448] rounded-xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-white/[0.02]">
                            <TableRow className="border-[#2a3448] hover:bg-transparent">
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-400 h-10 w-48">Date & Time</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-400 h-10">Phone</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-400 h-10">Duration</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-400 h-10">Status</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-400 h-10">Summary</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-400 h-10 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-400">Loading...</TableCell></TableRow>
                            ) : error ? (
                                <TableRow><TableCell colSpan={6} className="h-32 text-center text-red-400">Error loading logs. Check Supabase credentials.</TableCell></TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-400">No call logs found.</TableCell></TableRow>
                            ) : (
                                logs.map((log, i) => (
                                    <TableRow key={log.id || i} className="border-[#2a3448] hover:bg-white/[0.02]">
                                        <TableCell className="text-slate-400 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</TableCell>
                                        <TableCell className="font-semibold text-slate-200">{log.phone_number || 'Unknown'}</TableCell>
                                        <TableCell className="text-slate-300">{log.duration_seconds || 0}s</TableCell>
                                        <TableCell>{badgeFor(log.summary)}</TableCell>
                                        <TableCell className="text-slate-400 text-xs max-w-[250px] truncate" title={log.summary || ''}>
                                            {log.summary || '—'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {log.id && (
                                                    <a
                                                        href={getTranscriptUrl(log.id)}
                                                        download={`transcript_${log.id}.txt`}
                                                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-[#2a3448] bg-transparent hover:bg-white/5 hover:text-slate-100 h-8 px-3 py-1 text-slate-300"
                                                    >
                                                        <Download className="w-3.5 h-3.5 mr-1" /> Transcript
                                                    </a>
                                                )}
                                                {log.recording_url && (
                                                    <a
                                                        href={log.recording_url}
                                                        target="_blank" rel="noreferrer"
                                                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-[#2a3448] bg-transparent hover:bg-[#6c63ff]/10 hover:text-[#6c63ff] hover:border-[#6c63ff]/30 h-8 px-3 py-1 text-slate-300"
                                                    >
                                                        <Headphones className="w-3.5 h-3.5 mr-1" /> Recording
                                                    </a>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
