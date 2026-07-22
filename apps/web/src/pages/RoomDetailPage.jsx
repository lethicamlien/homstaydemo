import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import SiteLayout from "@/components/SiteLayout";
import pb from "@/lib/pocketbaseClient";
import { api, fmt, overlaps } from "@/lib/store";
import { CheckCircle2, Star, Ban } from "lucide-react";

export default function RoomDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [room, setRoom] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [err, setErr] = useState("");
  const [b, setB] = useState({ checkIn: sp.get("checkIn") || "", checkOut: sp.get("checkOut") || "", guests: sp.get("guests") || 2, type: "" });

  useEffect(() => {
    pb.collection("rooms").getOne(id).then((r) => { setRoom(r); setB((s) => ({ ...s, type: r.typeName })); }).catch(() => {});
    api.bookings().then(setBookings).catch(() => {});
  }, [id]);
  useEffect(() => { if (room) api.reviews(room.code).then(setReviews).catch(() => {}); }, [room]);

  if (!room) return <SiteLayout><div className="py-24 text-center">Đang tải...</div></SiteLayout>;

  const busy = b.checkIn && b.checkOut && bookings.some((x) => x.roomCode === room.code && x.status !== "cancelled" && overlaps(b.checkIn, b.checkOut, x.checkIn, x.checkOut));

  const proceed = () => {
    setErr("");
    if (!b.checkIn || !b.checkOut) return setErr("Vui lòng chọn ngày nhận và ngày trả.");
    if (new Date(b.checkOut) <= new Date(b.checkIn)) return setErr("Ngày trả phải sau ngày nhận.");
    if (busy) return setErr("Phòng đã có người đặt trong khoảng thời gian này.");
    nav("/booking", { state: { room, ...b } });
  };

  return (
    <SiteLayout>
      <div className="h-[360px] bg-cover bg-center" style={{ backgroundImage: `url(${(room.images || [])[0]})` }} />
      <div className="max-w-[80rem] mx-auto px-5 py-10 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <p className="text-accent font-bold">Giá: {fmt(room.price)}/1 đêm</p>
          <h1 className="font-display text-4xl font-extrabold mt-1">{room.typeName} · {room.code}</h1>
          <div className="flex gap-6 mt-3 text-muted-foreground text-sm">
            <span>{room.beds}</span><span>Phòng tắm riêng</span><span>{room.area}</span>
          </div>
          <p className="mt-4 leading-relaxed text-muted-foreground">{room.description}</p>

          <h3 className="font-display text-xl font-bold mt-8 text-primary">Tiện ích</h3>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {(room.amenities || []).map((a) => <div key={a} className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-primary" />{a}</div>)}
          </div>

          <h3 className="font-display text-xl font-bold mt-8 text-primary">Quy định</h3>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {(room.rules || []).map((a) => <div key={a} className="flex items-center gap-2"><Ban className="w-5 h-5 text-destructive" />{a}</div>)}
          </div>

          <h3 className="font-display text-xl font-bold mt-8 text-primary">Đánh giá từ khách hàng</h3>
          <div className="mt-3 space-y-3">
            {reviews.length === 0 && <p className="text-muted-foreground">Chưa có đánh giá nào!</p>}
            {reviews.map((rv) => (
              <div key={rv.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2"><b>{rv.author}</b>
                  <span className="flex">{Array.from({ length: rv.rating }).map((_, i) => <Star key={i} className="w-4 h-4 fill-accent text-accent" />)}</span>
                </div>
                <p className="text-sm mt-1">{rv.comment}</p>
                {rv.reply && <p className="text-sm mt-2 pl-3 border-l-2 border-primary text-muted-foreground"><b>Núi Homestay:</b> {rv.reply}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-primary/5 rounded-2xl p-6 h-fit sticky top-20">
          <h3 className="font-display text-xl font-bold text-center">Phòng của bạn</h3>
          <label className="block mt-4 text-sm font-semibold">Ngày nhận
            <input type="date" value={b.checkIn} onChange={(e) => setB({ ...b, checkIn: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-white border border-border" /></label>
          <label className="block mt-3 text-sm font-semibold">Ngày trả
            <input type="date" value={b.checkOut} onChange={(e) => setB({ ...b, checkOut: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-white border border-border" /></label>
          <label className="block mt-3 text-sm font-semibold">Loại phòng
            <input value={b.type} readOnly className="w-full mt-1 px-3 py-2 rounded-lg bg-white border border-border text-muted-foreground" /></label>
          <label className="block mt-3 text-sm font-semibold">Số người
            <input type="number" min={1} value={b.guests} onChange={(e) => setB({ ...b, guests: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-white border border-border" /></label>
          {err && <p className="text-destructive text-sm mt-3">{err}</p>}
          {busy && !err && <p className="text-destructive text-sm mt-3">Phòng đã kín trong khoảng ngày này.</p>}
          <button onClick={proceed} className="w-full mt-5 py-3 rounded-full bg-primary text-white font-semibold hover:brightness-110">Đặt ngay</button>
        </div>
      </div>
    </SiteLayout>
  );
}
