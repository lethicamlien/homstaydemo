import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SiteLayout from "@/components/SiteLayout";
import { api, fmt, overlaps } from "@/lib/store";
import { Wifi, Snowflake, BedDouble, Maximize, Search } from "lucide-react";

export default function RoomsPage() {
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [f, setF] = useState({
    checkIn: sp.get("checkIn") || "", checkOut: sp.get("checkOut") || "",
    guests: sp.get("guests") || "", type: sp.get("type") || "",
  });

  useEffect(() => {
    api.rooms().then(setRooms).catch(() => {});
    api.bookings().then(setBookings).catch(() => {});
  }, []);

  const roomBusy = (code) => {
    if (!f.checkIn || !f.checkOut) return false;
    return bookings.some((b) => b.roomCode === code && b.status !== "cancelled" &&
      overlaps(f.checkIn, f.checkOut, b.checkIn, b.checkOut));
  };

  const list = rooms.filter((r) => r.status === "active")
    .filter((r) => !f.type || r.typeName === f.type)
    .filter((r) => !roomBusy(r.code));

  const apply = () => {
    const q = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => v && q.set(k, v));
    setSp(q);
  };

  return (
    <SiteLayout>
      <div className="max-w-[80rem] mx-auto px-5 py-10">
        <h1 className="font-display text-4xl font-extrabold text-center">Phòng</h1>
        <div className="mt-6 bg-card rounded-2xl border border-border p-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          <input type="date" value={f.checkIn} onChange={(e) => setF({ ...f, checkIn: e.target.value })} className="px-3 py-2 rounded-lg bg-secondary text-sm" />
          <input type="date" value={f.checkOut} onChange={(e) => setF({ ...f, checkOut: e.target.value })} className="px-3 py-2 rounded-lg bg-secondary text-sm" />
          <input type="number" min={1} placeholder="Số khách" value={f.guests} onChange={(e) => setF({ ...f, guests: e.target.value })} className="px-3 py-2 rounded-lg bg-secondary text-sm" />
          <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} className="px-3 py-2 rounded-lg bg-secondary text-sm">
            <option value="">Tất cả loại</option><option>Phòng đơn</option><option>Phòng đôi</option><option>Phòng gia đình</option>
          </select>
          <button onClick={apply} className="bg-accent text-accent-foreground rounded-lg font-semibold flex items-center justify-center gap-2 py-2"><Search className="w-4 h-4" />Tìm</button>
        </div>

        <div className="mt-8 space-y-5">
          {list.length === 0 && <p className="text-center text-muted-foreground py-16">Không có phòng phù hợp với điều kiện tìm kiếm.</p>}
          {list.map((r) => (
            <div key={r.id} className="bg-card rounded-2xl border border-border overflow-hidden md:flex hover:shadow-lg transition">
              <div className="md:w-72 h-56 md:h-auto bg-cover bg-center" style={{ backgroundImage: `url(${(r.images || [])[0]})` }} />
              <div className="flex-1 p-5 flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-display text-2xl font-bold">{r.typeName}</h3>
                    <span className="text-xs bg-secondary px-2 py-1 rounded-full">{r.code}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Maximize className="w-4 h-4" />{r.area}</span>
                    <span className="flex items-center gap-1"><BedDouble className="w-4 h-4" />{r.beds}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {(r.amenities || []).slice(0, 4).map((a) => <span key={a} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1"><Wifi className="w-3 h-3" />{a}</span>)}
                  </div>
                  <p className="text-accent font-bold text-xl mt-3">{fmt(r.price)}<span className="text-xs text-muted-foreground font-normal">/1 ngày</span></p>
                </div>
                <div className="flex md:flex-col gap-2 md:justify-center">
                  <button onClick={() => nav("/rooms/" + r.id)} className="px-5 py-2 rounded-full border border-primary text-primary font-semibold hover:bg-primary hover:text-white transition">Xem chi tiết</button>
                  <button onClick={() => nav(`/rooms/${r.id}?book=1&${sp.toString()}`)} className="px-5 py-2 rounded-full bg-primary text-white font-semibold hover:brightness-110">Đặt phòng ngay</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}
