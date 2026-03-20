import { useEffect, useState } from "react";
import { fetchContacts } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";

export default function CrmContacts() {
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const loadData = async () => {
        setLoading(true);
        setError(false);
        try {
            const contactsData = await fetchContacts();
            setContacts(contactsData || []);
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

    return (
        <div className="p-8 pb-20 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">👥 CRM Contacts</h1>
                    <p className="text-sm text-slate-500 mt-1">Every caller recorded automatically — name, phone, call history</p>
                </div>
                <Button variant="outline" onClick={loadData} disabled={loading} className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900">
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </Button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="border-slate-200 hover:bg-transparent">
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 h-10 w-1/4">Name</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 h-10 w-1/4">Phone</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 h-10 text-center">Total Calls</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 h-10">Last Seen</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 h-10">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="h-32 text-center text-slate-500">Loading contacts...</TableCell></TableRow>

                            ) : error ? (
                                <TableRow><TableCell colSpan={5} className="h-32 text-center text-red-500">Error loading contacts. Check Supabase credentials.</TableCell></TableRow>
                            ) : contacts.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="h-32 text-center text-slate-500">No contacts yet. They will appear here automatically after calls.</TableCell></TableRow>
                            ) : (
                                contacts.map((c, i) => (
                                    <TableRow key={i} className="border-slate-200 hover:bg-slate-50/50">
                                        <TableCell className="font-semibold text-slate-900">
                                            {c.caller_name || <span className="font-normal text-slate-400">Unknown</span>}
                                        </TableCell>
                                        <TableCell className="font-mono text-sm text-slate-600">{c.phone_number || '—'}</TableCell>
                                        <TableCell className="text-center">
                                            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#6c63ff]/15 text-[#6c63ff]">
                                                {c.total_calls}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-slate-500 text-xs text-muted-foreground whitespace-nowrap">
                                            {c.last_seen ? new Date(c.last_seen).toLocaleString('en-US', {
                                                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            }) : '—'}
                                        </TableCell>
                                        <TableCell>
                                            {c.is_booked ? (
                                                <Badge className="bg-green-500/15 text-green-500 pointer-events-none hover:bg-green-500/25">✅ Booked</Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-500 pointer-events-none">📵 No booking</Badge>
                                            )}
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
