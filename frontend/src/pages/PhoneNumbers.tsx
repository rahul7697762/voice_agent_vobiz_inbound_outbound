import { useEffect, useState } from "react";
import { fetchOwnedNumbers, fetchAvailableNumbers, purchaseNumber } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Search, Phone, ShoppingCart, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const COUNTRIES = [
    { code: "US", label: "🇺🇸 United States" },
    { code: "IN", label: "🇮🇳 India" },
    { code: "GB", label: "🇬🇧 United Kingdom" },
    { code: "CA", label: "🇨🇦 Canada" },
    { code: "AU", label: "🇦🇺 Australia" },
    { code: "DE", label: "🇩🇪 Germany" },
    { code: "FR", label: "🇫🇷 France" },
    { code: "SG", label: "🇸🇬 Singapore" },
    { code: "AE", label: "🇦🇪 UAE" },
];

type Tab = "owned" | "buy";

export default function PhoneNumbers() {
    const [activeTab, setActiveTab] = useState<Tab>("owned");

    // Owned Numbers state
    const [owned, setOwned] = useState<any[]>([]);
    const [ownedLoading, setOwnedLoading] = useState(true);
    const [ownedError, setOwnedError] = useState("");

    // Search state
    const [country, setCountry] = useState("US");
    const [areaCode, setAreaCode] = useState("");
    const [available, setAvailable] = useState<any[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState("");
    const [searched, setSearched] = useState(false);
    const [purchasing, setPurchasing] = useState<string | null>(null);

    const loadOwned = async () => {
        setOwnedLoading(true);
        setOwnedError("");
        try {
            const data = await fetchOwnedNumbers();
            // Vobiz may return data as array or wrapped object {data: [...]}
            setOwned(Array.isArray(data) ? data : (data?.data ?? data?.phone_numbers ?? []));
        } catch (e: any) {
            const msg = e?.response?.data?.detail || e?.message || "Failed to load numbers.";
            setOwnedError(msg);
        } finally {
            setOwnedLoading(false);
        }
    };

    const handleSearch = async () => {
        setSearchLoading(true);
        setSearchError("");
        setSearched(true);
        try {
            const data = await fetchAvailableNumbers(country, 20, areaCode);
            setAvailable(Array.isArray(data) ? data : (data?.data ?? data?.phone_numbers ?? []));
        } catch (e: any) {
            const msg = e?.response?.data?.detail || e?.message || "Failed to search numbers.";
            setSearchError(msg);
            setAvailable([]);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleBuy = async (number: any) => {
        const id = number.did_id || number.id || number.number;
        if (!id) { toast.error("Cannot determine number ID"); return; }
        setPurchasing(id);
        try {
            await purchaseNumber({ did_id: id });
            toast.success(`✅ Number ${number.did || number.number || id} purchased successfully!`);
            // Refresh available list and switch to owned
            setAvailable(prev => prev.filter(n => (n.did_id || n.id || n.number) !== id));
            setTimeout(() => { setActiveTab("owned"); loadOwned(); }, 1000);
        } catch (e: any) {
            const msg = e?.response?.data?.detail || e?.message || "Purchase failed.";
            toast.error(`❌ ${msg}`);
        } finally {
            setPurchasing(null);
        }
    };

    useEffect(() => { loadOwned(); }, []);

    return (
        <div className="p-8 pb-20 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Phone className="w-6 h-6 text-[#6c63ff]" />
                    Phone Numbers
                </h1>
                <p className="text-sm text-slate-500 mt-1">Manage your Vobiz phone numbers or purchase new ones</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 p-1 bg-slate-100 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab("owned")}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "owned" ? "bg-white text-[#6c63ff] shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                >
                    📋 My Numbers
                </button>
                <button
                    onClick={() => setActiveTab("buy")}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "buy" ? "bg-white text-[#6c63ff] shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                >
                    🛒 Buy Number
                </button>
            </div>

            {/* ── My Numbers Tab ── */}
            {activeTab === "owned" && (
                <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-200">
                        <CardTitle className="text-base font-semibold text-slate-900">All Owned Numbers</CardTitle>
                        <Button variant="ghost" size="sm" onClick={loadOwned} disabled={ownedLoading} className="text-slate-500 hover:text-slate-900 hover:bg-slate-100">
                            <RefreshCw className={`w-4 h-4 mr-2 ${ownedLoading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="border-slate-200 hover:bg-transparent">
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 h-10">Number</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 h-10">Country</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 h-10">Type</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 h-10">Status</TableHead>
                                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 h-10">Monthly Rate</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ownedLoading ? (
                                    <TableRow><TableCell colSpan={5} className="h-32 text-center text-slate-500">Loading your numbers...</TableCell></TableRow>
                                ) : ownedError ? (
                                    <TableRow><TableCell colSpan={5} className="h-32 text-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-500">
                                            <AlertCircle className="w-5 h-5 text-red-400" />
                                            <span className="text-red-500 text-sm">{ownedError}</span>
                                            <span className="text-xs text-slate-400">Add your Vobiz credentials in API Credentials settings.</span>
                                        </div>
                                    </TableCell></TableRow>
                                ) : owned.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="h-32 text-center text-slate-500">
                                        No numbers found. Buy one from the "Buy Number" tab.
                                    </TableCell></TableRow>
                                ) : (
                                    owned.map((n, i) => (
                                        <TableRow key={n.did_id || n.id || i} className="border-slate-200 hover:bg-slate-50/50">
                                            <TableCell className="font-semibold text-slate-900 font-mono">{n.did || n.number || "—"}</TableCell>
                                            <TableCell className="text-slate-600">{n.country || n.country_code || "—"}</TableCell>
                                            <TableCell className="text-slate-600 capitalize">{n.type || n.number_type || "—"}</TableCell>
                                            <TableCell>
                                                <Badge className={n.status === "active" ? "bg-green-500/15 text-green-600" : "bg-slate-100 text-slate-500"}>
                                                    {n.status || "active"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-600">{n.monthly_rate || n.monthly_cost ? `$${n.monthly_rate || n.monthly_cost}` : "—"}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* ── Buy Number Tab ── */}
            {activeTab === "buy" && (
                <div className="space-y-5">
                    {/* Search Form */}
                    <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader className="pb-4 border-b border-slate-200">
                            <CardTitle className="text-base font-semibold text-slate-900">Search Available Numbers</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-5">
                            <div className="flex flex-wrap items-end gap-3">
                                <div className="flex-1 min-w-[180px] max-w-[240px] space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Country</label>
                                    <Select value={country} onValueChange={setCountry}>
                                        <SelectTrigger className="bg-white border-slate-200 text-slate-900 shadow-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white border-slate-200 text-slate-900">
                                            {COUNTRIES.map(c => (
                                                <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex-1 min-w-[140px] max-w-[200px] space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Area Code (optional)</label>
                                    <Input
                                        placeholder="e.g. 212"
                                        value={areaCode}
                                        onChange={e => setAreaCode(e.target.value)}
                                        className="bg-white border-slate-200 focus-visible:ring-[#6c63ff] text-slate-900 shadow-sm"
                                    />
                                </div>
                                <Button
                                    onClick={handleSearch}
                                    disabled={searchLoading}
                                    className="bg-[#6c63ff] hover:bg-[#5a52e0] text-white px-6"
                                >
                                    <Search className={`w-4 h-4 mr-2 ${searchLoading ? "animate-spin" : ""}`} />
                                    {searchLoading ? "Searching..." : "Search Numbers"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Results */}
                    {searched && (
                        <Card className="bg-white border-slate-200 shadow-sm">
                            <CardHeader className="pb-4 border-b border-slate-200">
                                <CardTitle className="text-base font-semibold text-slate-900">
                                    Available Numbers
                                    {!searchLoading && available.length > 0 && (
                                        <span className="ml-2 text-xs font-medium bg-[#6c63ff]/10 text-[#6c63ff] px-2 py-0.5 rounded-full">
                                            {available.length} found
                                        </span>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader className="bg-slate-50/50">
                                        <TableRow className="border-slate-200 hover:bg-transparent">
                                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 h-10">Number</TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 h-10">Country</TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 h-10">Type</TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 h-10">Monthly Rate</TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 h-10">Setup Fee</TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-slate-500 h-10 text-right">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {searchLoading ? (
                                            <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-500">Searching Vobiz inventory...</TableCell></TableRow>
                                        ) : searchError ? (
                                            <TableRow><TableCell colSpan={6} className="h-32 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <AlertCircle className="w-5 h-5 text-red-400" />
                                                    <span className="text-red-500 text-sm">{searchError}</span>
                                                </div>
                                            </TableCell></TableRow>
                                        ) : available.length === 0 ? (
                                            <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-500">
                                                No numbers found for that country / area code. Try a different search.
                                            </TableCell></TableRow>
                                        ) : (
                                            available.map((n, i) => {
                                                const id = n.did_id || n.id || n.number;
                                                const isBuying = purchasing === id;
                                                return (
                                                    <TableRow key={id || i} className="border-slate-200 hover:bg-slate-50/50">
                                                        <TableCell className="font-semibold text-slate-900 font-mono">{n.did || n.number || "—"}</TableCell>
                                                        <TableCell className="text-slate-600">{n.country || n.country_code || country}</TableCell>
                                                        <TableCell className="text-slate-600 capitalize">{n.type || n.number_type || "—"}</TableCell>
                                                        <TableCell className="text-slate-700 font-medium">{n.monthly_rate || n.monthly_cost ? `$${n.monthly_rate || n.monthly_cost}/mo` : "—"}</TableCell>
                                                        <TableCell className="text-slate-600">{n.setup_cost || n.setup_fee ? `$${n.setup_cost || n.setup_fee}` : "$0"}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                size="sm"
                                                                disabled={!!purchasing}
                                                                onClick={() => handleBuy(n)}
                                                                className="bg-[#6c63ff] hover:bg-[#5a52e0] text-white"
                                                            >
                                                                {isBuying ? (
                                                                    <><RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" /> Buying...</>
                                                                ) : (
                                                                    <><ShoppingCart className="w-3.5 h-3.5 mr-1" /> Buy</>
                                                                )}
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}

                    {!searched && (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <Search className="w-10 h-10 mb-3 opacity-30" />
                            <p className="text-sm">Select a country and click Search to browse available numbers</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
