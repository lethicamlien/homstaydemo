import React, { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import SiteLayout from "@/components/SiteLayout";
import pb from "@/lib/pocketbaseClient";
import { useAuth } from "@/lib/AuthContext";
import { fmtVND, fmtDate, genCode } from "@/lib/store";
import { Star } from "lucide-react";

const PAY = { unpaid: "Chưa thanh toán", deposit: "Đã cọc giữ phòng", paid: "Đã thanh toán" };
const ST = { pending: "Chờ xác nhận", confirmed: "Đã xác nhận", checkedin: "Đang ở", checkedout: "Đã trả phòng", cancelled: "Đã hủy" };

export default function HistoryPage() {
  const { user, isAuthed } = useAuth();
  const [list, setList] = useState([]);
  const [rv, setRv] = useState({});
  useEffect(() => {
    if (user) pb.collection("bookings").getFullList({ filter: pb.filter("customer = {:id}", { id: user.id }), sort: "-created" }).then(setList).catch(() => {});
  }, [user]);
  if (!isAuthed) return <Navigate to="/auth" replace />;

  const review = async (b) => {
    const r = rv[b.id]; if (!r?.comment) return;
    await pb.collection("reviews").create({ roomCode: b.roomCode, author: b.guestName, rating: r.rating || 5, comment: r.comment });
    setRv((s) => ({ ...s, [b.id]: { done: true } }));
  };

  return (
    <SiteLayout>
      <div className="max-w-4xl mx-auto px-5 py-10">
        <h1 className="font-display text-4xl font-extrabold">Lịch sử đặt phòng</h1>
        <div className="mt-6 space-y-4">
          {list.length === 0 && <p className="text-muted-foreground py-10 text-center">Bạn chưa có đặt phòng nào. <Link to="/rooms" className="text-primary">Đặt ngay »</Link></p>}
          {list.map((b) => (
            <div key={b.id} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-display text-lg font-bold">{b.roomTypeName} · {b.roomCode}</p>
                  <p className="text-sm text-muted-foreground">Mã: {b.code} · {fmtDate(b.checkIn)} → {fmtDate(b.checkOut)} · {b.nights} đêm</p>
                </div>
                <div className="text-right">
                  <p className="text-accent font-bold">{fmtVND(b.total)}</p>
                  <p className="text-xs"><span className="bg-secondary px-2 py-1 rounded-full">{ST[b.status]}</span> <span className="bg-secondary px-2 py-1 rounded-full">{PAY[b.payStatus]}</span></p>
                </div>
              </div>
              {b.payStatus === "paid" && !rv[b.id]?.done && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-1 mb-2">{[1,2,3,4,5].map((n) => <button key={n} onClick={() => setRv((s) => ({ ...s, [b.id]: { ...s[b.id], rating: n } }))}><Star className={`w-5 h-5 ${(rv[b.id]?.rating || 0) >= n ? "fill-accent text-accent" : "text-muted-foreground"}`} /></button>)}</div>
                  <div className="flex gap-2">
                    <input placeholder="Viết đánh giá..." onChange={(e) => setRv((s) => ({ ...s, [b.id]: { ...s[b.id], comment: e.target.value } }))} className="flex-1 px-3 py-2 rounded-lg bg-secondary text-sm" />
                    <button onClick={() => review(b)} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold">Gửi</button>
                  </div>
                </div>
              )}
              {rv[b.id]?.done && <p className="mt-3 text-sm text-primary">Cảm ơn bạn đã đánh giá!</p>}
            </div>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}
