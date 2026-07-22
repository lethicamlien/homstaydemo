import React, { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import pb from "@/lib/pocketbaseClient";
import { useAuth } from "@/lib/AuthContext";
import { api, fmt, fmtVND, fmtDate, overlaps } from "@/lib/store";
import { LayoutGrid, List, LogOut, X } from "lucide-react";

const STATUS_COLOR = { coming: "bg-red-400", staying: "bg-yellow-300", checkout: "bg-blue-500", empty: "bg-green-400" };
const STATUS_LABEL = { coming: "Sắp đến", staying: "Đang ở", checkout: "Sắp trả", empty: "Phòng trống" };

export default function ReceptionPage() {
  const { role } = useAuth();
  const [view, setView] = useState("grid");
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [sel, setSel] = useState(null);
  const load = () => { api.rooms().then(setRooms); api.bookings().then(setBookings); };
  useEffect(() => { load(); }, []);
  if (role !== "receptionist" && role !== "admin") return <Navigate to="/auth" replace />;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 86400000);
  const roomState = (code) => {
    const bs = bookings.filter((b) => b.roomCode === code && b.status !== "cancelled");
    for (const b of bs) {
      const ci = new Date(b.checkIn), co = new Date(b.checkOut);
      if (ci <= today && co > today) return { s: "staying", b };
      if (ci >= today && ci < tomorrow) return { s: "coming", b };
    }
    return { s: "empty", b: null };
  };

  const roomBookings = (code) => bookings.filter((b) => b.roomCode === code && b.status !== "cancelled");
  const days = Array.from({ length: 7 }, (_, i) => new Date(today.getTime() + i * 86400000));
  const confirm = async (b, status) => { await pb.collection("bookings").update(b.id, { status }); load(); setSel(null); };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-white px-5 h-14 flex items-center justify-between">
        <span className="font-display font-extrabold">Núi Homestay · Lễ tân</span>
        <div className="flex items-center gap-3">
          <button onClick={() => setView("grid")} className={`p-2 rounded-lg ${view === "grid" ? "bg-white/25" : ""}`}><LayoutGrid className="w-5 h-5" /></button>
          <button onClick={() => setView("timeline")} className={`p-2 rounded-lg ${view === "timeline" ? "bg-white/25" : ""}`}><List className="w-5 h-5" /></button>
          <Link to="/" className="text-white/80"><LogOut className="w-4 h-4" /></Link>
        </div>
      </header>

      <div className="max-w-[80rem] mx-auto px-5 py-6">
        <div className="flex flex-wrap gap-4 mb-6">
          {Object.entries(STATUS_LABEL).map(([k, l]) => <span key={k} className="flex items-center gap-2 text-sm"><span className={`w-4 h-4 rounded-full ${STATUS_COLOR[k]}`} />{l}</span>)}
        </div>

        {view === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {rooms.map((r) => { const st = roomState(r.code); return (
              <button key={r.id} onClick={() => st.b && setSel(st.b)} className="text-left bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition">
                <div className={`${STATUS_COLOR[st.s]} px-3 py-2 font-bold text-black/80`}>{r.code}</div>
                <div className="p-3"><p className="text-sm text-muted-foreground">{r.typeName}</p><p className="font-semibold mt-1">{fmt(r.price)}/ngày</p>{st.b && <p className="text-xs mt-2 text-primary">{st.b.guestName}</p>}</div>
              </button>
            ); })}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="grid" style={{ gridTemplateColumns: `100px repeat(7,1fr)` }}>
                <div className="p-3 font-semibold bg-secondary">Phòng</div>
                {days.map((d) => <div key={d} className="p-3 text-center text-sm bg-secondary border-l border-border">{d.getDate()}/{d.getMonth() + 1}</div>)}
                {rooms.map((r) => (
                  <React.Fragment key={r.id}>
                    <div className="p-3 font-semibold border-t border-border">{r.code}</div>
                    <div className="col-span-7 border-t border-l border-border relative h-12">
                      {roomBookings(r.code).map((b) => {
                        const s = Math.max(0, Math.round((new Date(b.checkIn) - days[0]) / 86400000));
                        const e = Math.min(7, Math.round((new Date(b.checkOut) - days[0]) / 86400000));
                        if (e <= 0 || s >= 7) return null;
                        return <button key={b.id} onClick={() => setSel(b)} className="absolute top-1 bottom-1 bg-primary/80 text-white text-xs rounded px-2 truncate" style={{ left: `${(s / 7) * 100}%`, width: `${((e - s) / 7) * 100}%` }}>{b.code} · {b.guestName}</button>;
                      })}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {sel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSel(null)}>
          <div className="bg-card rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4"><h3 className="font-display text-xl font-bold">Chi tiết đặt phòng</h3><button onClick={() => setSel(null)}><X /></button></div>
            <div className="space-y-1 text-sm">
              <p>Mã booking: <b className="text-primary">{sel.code}</b></p>
              <p>Khách: <b>{sel.guestName}</b> · {sel.guestPhone}</p>
              <p>Phòng: <b>{sel.roomCode}</b> ({sel.roomTypeName})</p>
              <p>Nhận → Trả: {fmtDate(sel.checkIn)} → {fmtDate(sel.checkOut)}</p>
              <p>Tổng: <b className="text-accent">{fmtVND(sel.total)}</b></p>
              <p>Thanh toán: {sel.payStatus === "paid" ? "Đã thanh toán" : sel.payStatus === "deposit" ? "Đã cọc" : "Chưa thanh toán"}</p>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => confirm(sel, "checkedin")} className="flex-1 py-2 rounded-lg bg-yellow-400 text-black font-semibold text-sm">Nhận phòng</button>
              <button onClick={() => confirm(sel, "checkedout")} className="flex-1 py-2 rounded-lg bg-primary text-white font-semibold text-sm">Trả phòng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
