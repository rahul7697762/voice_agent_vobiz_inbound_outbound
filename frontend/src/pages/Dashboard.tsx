import { useEffect, useState } from "react";
import { fetchStats, fetchLogs, getTranscriptUrl } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download } from "lucide-react";

export default function Dashboard() {
    const [stats, setStats] = useState<any>({ total_calls: "—", total_bookings: "—", avg_duration: "—", booking_rate: "—" });
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const loadData = async () => {
        setLoading(true);
        setError(false);
        try {
            const [statsData, logsData] = await Promise.all([
                fetchStats(),
                fetchLogs()
            ]);
            setStats(statsData);
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
        if (lower.includes('confirm')) return <Badge className="bg-green-500/15 text-green-500 hover:bg-green-500/25 pointer-events-none">✓ Booked</Badge>;
        if (lower.includes('cancel')) return <Badge className="bg-yellow-500/15 text-yellow-500 hover:bg-yellow-500/25 pointer-events-none">✗ Cancelled</Badge>;
        return <Badge variant="secondary" className="bg-white/10 text-slate-300 pointer-events-none">Completed</Badge>;
    };

    return (
        <div className="p-8 pb-20 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
                <p className="text-sm text-slate-400 mt-1">Real-time overview of your AI voice agent performance</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard title="Total Calls" value={stats.total_calls} desc="All time" />
                <StatCard title="Bookings Made" value={stats.total_bookings} desc="Confirmed appointments" />
                <StatCard title="Avg Duration" value={stats.avg_duration ? `${stats.avg_duration}s` : "—"} desc="Seconds per call" />
                <StatCard title="Booking Rate" value={stats.booking_rate ? `${stats.booking_rate}%` : "—"} desc="Calls that converted" />
            </div>

            <Card className="bg-[#1c2333] border-[#2a3448] shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-[#2a3448]">
                    <CardTitle className="text-lg font-semibold text-slate-100">Recent Calls</CardTitle>
                    <Button variant="ghost" size="sm" onClick={loadData} disabled={loading} className="text-slate-400 hover:text-slate-100">
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-white/[0.02]">
                                <TableRow className="border-[#2a3448] hover:bg-transparent">
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-400 h-10">Date</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-400 h-10">Phone</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-400 h-10">Duration</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-400 h-10">Status</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-400 h-10">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={5} className="h-24 text-center text-slate-400">Loading...</TableCell></TableRow>
                                ) : error ? (
                                    <TableRow><TableCell colSpan={5} className="h-24 text-center text-red-400">Could not load data — check API connection.</TableCell></TableRow>
                                ) : logs.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="h-24 text-center text-slate-400">No calls yet. Make a test call!</TableCell></TableRow>
                                ) : (
                                    logs.slice(0, 10).map((log, i) => (
                                        <TableRow key={log.id || i} className="border-[#2a3448] hover:bg-white/[0.02]">
                                            <TableCell className="text-slate-400">{new Date(log.created_at).toLocaleString()}</TableCell>
                                            <TableCell className="font-semibold text-slate-200">{log.phone_number || 'Unknown'}</TableCell>
                                            <TableCell className="text-slate-300">{log.duration_seconds || 0}s</TableCell>
                                            <TableCell>{badgeFor(log.summary)}</TableCell>
                                            <TableCell>
                                                {log.id && (
                                                    <a
                                                        href={getTranscriptUrl(log.id)}
                                                        download={`transcript_${log.id}.txt`}
                                                        className="text-[#6c63ff] hover:text-[#5a52e0] text-xs font-medium flex items-center transition-colors"
                                                    >
                                                        <Download className="w-3 h-3 mr-1" /> Download
                                                    </a>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function StatCard({ title, value, desc }: { title: string, value: string | number, desc: string }) {
    return (
        <Card className="bg-[#1c2333] border-[#2a3448] transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(108,99,255,0.12)]">
            <CardContent className="p-5">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{title}</div>
                <div className="text-3xl font-bold text-slate-100 mt-2">{value}</div>
                <div className="text-xs text-slate-400 mt-1">{desc}</div>
            </CardContent>
        </Card>
    );
}
