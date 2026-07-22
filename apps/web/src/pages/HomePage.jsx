import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SiteLayout from "@/components/SiteLayout";
import { api, fmt } from "@/lib/store";
import { CalendarCheck, CalendarX, Users, Home, Search, Wifi, Tv, Snowflake, Flame, Star, MapPin } from "lucide-react";

function SearchBar({ onSearch }) {
  const [f, setF] = useState({ checkIn: "", checkOut: "", guests: 2, type: "" });
  return (
    <div className="bg-white rounded-2xl shadow-xl p-3 grid grid-cols-2 md:grid-cols-5 gap-3 max-w-4xl mx-auto">
      {[
        { k: "checkIn", label: "Ngày nhận", icon: CalendarCheck, type: "date" },
        { k: "checkOut", label: "Ngày trả", icon: CalendarX, type: "date" },
        { k: "guests", label: "Số khách", icon: Users, type: "number" },
      ].map((x) => (
        <label key={x.k} className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1"><x.icon className="w-3.5 h-3.5" />{x.label}</span>
          <input type={x.type} min={1} value={f[x.k]} onChange={(e) => setF({ ...f, [x.k]: e.target.value })} className="px-3 py-2 rounded-lg bg-secondary text-sm outline-none" />
        </label>
      ))}
      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1"><Home className="w-3.5 h-3.5" />Loại phòng</span>
        <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} className="px-3 py-2 rounded-lg bg-secondary text-sm outline-none">
          <option value="">Tất cả</option>
          <option>Phòng đơn</option><option>Phòng đôi</option><option>Phòng gia đình</option>
        </select>
      </label>
      <button onClick={() => onSearch(f)} className="bg-accent text-accent-foreground rounded-lg font-semibold flex items-center justify-center gap-2 hover:brightness-105 py-2 md:mt-5"><Search className="w-4 h-4" />Tìm kiếm</button>
    </div>
  );
}

export default function HomePage() {
  const nav = useNavigate();
  const [rooms, setRooms] = useState([]);
  useEffect(() => { api.rooms().then((r) => setRooms(r.slice(0, 3))).catch(() => {}); }, []);
  const go = (f) => {
    const q = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => v && q.set(k, v));
    nav("/rooms?" + q.toString());
  };
  const amenities = [{ i: Wifi, t: "Wifi" }, { i: Tv, t: "Tivi" }, { i: Snowflake, t: "Điều hòa" }, { i: Flame, t: "Nóng lạnh" }];
  return (
    <SiteLayout>
      <section className="relative">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600)" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/40 to-background" />
        <div className="relative max-w-[80rem] mx-auto px-5 pt-24 pb-40 text-white text-center">
          <p className="font-display text-accent font-bold tracking-wide animate-fadeup">CHÀO MỪNG ĐẾN HUẾ</p>
          <h1 className="font-display text-5xl md:text-7xl font-extrabold mt-2 text-balance animate-fadeup">Núi Homestay</h1>
          <p className="mt-4 text-lg text-white/90 max-w-xl mx-auto animate-fadeup">Nghỉ dưỡng yên bình giữa thiên nhiên xanh mát, chỉ cách trung tâm cố đô 3,6km.</p>
        </div>
        <div className="relative -mt-24 px-5 pb-8"><SearchBar onSearch={go} /></div>
      </section>

      <section className="max-w-[80rem] mx-auto px-5 py-14">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-display text-3xl font-extrabold">Phòng nổi bật</h2>
          <button onClick={() => nav("/rooms")} className="text-primary font-semibold hover:underline">Xem thêm »</button>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {rooms.map((r) => (
            <div key={r.id} className="group bg-card rounded-2xl overflow-hidden shadow-sm border border-border hover:shadow-xl transition">
              <div className="h-52 bg-cover bg-center group-hover:scale-105 transition duration-500" style={{ backgroundImage: `url(${(r.images || [])[0]})` }} />
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-bold">{r.typeName}</h3>
                  <span className="text-xs bg-secondary px-2 py-1 rounded-full">{r.code}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{r.beds} · phù hợp cho khách</p>
                <p className="text-accent font-bold text-lg mt-2">{fmt(r.price)}<span className="text-xs text-muted-foreground font-normal">/đêm</span></p>
                <button onClick={() => nav("/rooms/" + r.id)} className="mt-4 w-full py-2 rounded-full bg-primary text-white font-semibold hover:brightness-110">Xem chi tiết</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-[80rem] mx-auto px-5 py-6">
        <h2 className="font-display text-3xl font-extrabold text-center mb-8">Các tiện nghi</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {amenities.map((a) => (
            <div key={a.t} className="bg-card rounded-2xl border border-border p-6 flex flex-col items-center gap-3 hover:border-primary transition">
              <a.i className="w-9 h-9 text-primary" /><span className="font-semibold">{a.t}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="gioi-thieu" className="max-w-[80rem] mx-auto px-5 py-14 grid md:grid-cols-2 gap-10 items-center">
        <div className="h-72 rounded-2xl bg-cover bg-center shadow-lg animate-floaty" style={{ backgroundImage: "url(https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1000)" }} />
        <div>
          <h2 className="font-display text-3xl font-extrabold">Về chúng tôi</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">Núi Homestay là điểm dừng chân lý tưởng cho những ai yêu thích sự yên tĩnh và gần gũi thiên nhiên. Với hệ thống phòng đầy đủ tiện nghi, dịch vụ chu đáo và vị trí thuận tiện, chúng tôi cam kết mang đến cho bạn kỳ nghỉ trọn vẹn tại Huế.</p>
          <div className="flex items-center gap-2 mt-4 text-primary"><MapPin className="w-5 h-5" /> Cách trung tâm TP. Huế 3,6km</div>
        </div>
      </section>

      <section id="lien-he" className="max-w-[80rem] mx-auto px-5 pb-4">
        <div className="bg-primary/5 rounded-2xl p-8 text-center">
          <h2 className="font-display text-3xl font-extrabold">Liên hệ</h2>
          <p className="mt-3 text-muted-foreground">Điện thoại: 035 356 600 · Email: Nuihomstay@gmail.com</p>
        </div>
      </section>
    </SiteLayout>
  );
}
