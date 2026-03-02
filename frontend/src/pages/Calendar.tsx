import { useEffect, useState } from "react";
import { fetchBookings } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Phone } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from "date-fns";

export default function Calendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [bookings, setBookings] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        fetchBookings()
            .then(res => setBookings(res || []))
            .catch(console.error);
    }, []);

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    const startDay = startOfMonth(currentDate);
    const endDay = endOfMonth(currentDate);

    // Calculate padding days
    const startPad = startDay.getDay();
    const endPad = 6 - endDay.getDay();

    const paddedStart = new Date(startDay);
    paddedStart.setDate(startDay.getDate() - startPad);

    const paddedEnd = new Date(endDay);
    paddedEnd.setDate(endDay.getDate() + endPad);

    const days = eachDayOfInterval({ start: paddedStart, end: paddedEnd });

    // Map bookings by date string (YYYY-MM-DD)
    const bookMap: Record<string, any[]> = {};
    bookings.forEach(b => {
        if (b.created_at) {
            const d = b.created_at.slice(0, 10);
            bookMap[d] = bookMap[d] || [];
            bookMap[d].push(b);
        }
    });

    const handleDayClick = (day: Date) => {
        setSelectedDate(day);
        setModalOpen(true);
    };

    const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
    const selectedBookings = selectedDateStr ? (bookMap[selectedDateStr] || []) : [];

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="p-8 pb-20 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-100">Booking Calendar</h1>
                <p className="text-sm text-slate-400 mt-1">View confirmed appointments by date</p>
            </div>

            <div className="bg-[#1c2333] border border-[#2a3448] rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                    <Button variant="ghost" size="sm" onClick={() => changeMonth(-1)} className="text-slate-400 hover:text-slate-100">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                    </Button>
                    <div className="text-lg font-bold text-slate-100">
                        {format(currentDate, "MMMM yyyy")}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => changeMonth(1)} className="text-slate-400 hover:text-slate-100">
                        Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                    {weekDays.map(d => (
                        <div key={d} className="text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-2">
                            {d}
                        </div>
                    ))}

                    {days.map((day, i) => {
                        const dateStr = format(day, "yyyy-MM-dd");
                        const dayBookings = bookMap[dateStr] || [];
                        const isCurrentMonth = isSameMonth(day, currentDate);
                        const isTodayDate = isToday(day);

                        return (
                            <button
                                key={i}
                                onClick={() => handleDayClick(day)}
                                className={`
                  min-h-[80px] p-2.5 rounded-xl border flex flex-col items-start transition-all relative text-left
                  ${!isCurrentMonth ? "opacity-30 bg-[#1c2333]/50 border-transparent" : "bg-[#1c2333] border-[#2a3448] hover:border-[#6c63ff] hover:bg-[#6c63ff]/10 hover:scale-[1.03] hover:shadow-[0_4px_20px_rgba(108,99,255,0.15)] z-10"}
                  ${isTodayDate ? "border-[#6c63ff] shadow-[0_0_0_2px_rgba(108,99,255,0.18)]" : ""}
                `}
                            >
                                <div className={`text-[13px] font-bold ${isTodayDate ? "text-[#6c63ff]" : "text-slate-200"}`}>
                                    {format(day, "d")}
                                </div>
                                {dayBookings.length > 0 && (
                                    <div className="mt-1.5 flex flex-col">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#6c63ff] shadow-[0_0_6px_#6c63ff]"></div>
                                        <div className="text-[10px] text-[#6c63ff] font-semibold mt-1">
                                            {dayBookings.length} booking{dayBookings.length > 1 ? 's' : ''}
                                        </div>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="bg-[#1c2333] border-[#2a3448] text-slate-200 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-slate-100">
                            {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : ""}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            {selectedBookings.length ? `${selectedBookings.length} booking${selectedBookings.length > 1 ? 's' : ''} on this day` : 'No bookings on this day'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[60vh] overflow-y-auto pr-2 pb-2 mt-2 space-y-3">
                        {selectedBookings.length === 0 ? (
                            <div className="text-center p-8 text-sm text-slate-400">
                                📅 No bookings on this day.
                            </div>
                        ) : (
                            selectedBookings.map((b, i) => (
                                <div key={b.id || i} className="p-3.5 bg-[#0f1117] border border-[#2a3448] rounded-xl hover:border-[#6c63ff] transition-colors">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="font-bold text-[14px] flex items-center text-slate-200">
                                            <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                                            {b.phone_number || 'Unknown'}
                                        </div>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/15 text-green-500">
                                            ✅ Booked
                                        </span>
                                    </div>
                                    <div className="text-[12px] text-slate-400 mb-2">
                                        🕐 {new Date(b.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    {b.summary && (
                                        <div className="text-[12px] text-slate-300 p-2 bg-white/5 rounded-md leading-relaxed">
                                            💬 {b.summary}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
