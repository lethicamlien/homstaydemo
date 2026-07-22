import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import SiteLayout from "@/components/SiteLayout";
import pb from "@/lib/pocketbaseClient";
import { api, fmt, fmtVND, nights, genCode, fmtDate } from "@/lib/store";
import { Minus, Plus, Copy, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

export default function BookingPage() {
  const loc = useLocation();
  const nav = useNavigate();
  const { user } = useAuth();
  const st = loc.state;
  const [services, setServices] = useState([]);
  const [qty, setQty] = useState({});
  const [info, setInfo] = useState({ guestName: user?.fullName || "", guestPhone: user?.phone || "", guestEmail: user?.email || "", guestAddress: "", note: "" });
  const [pay, setPay] = useState("cash");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => { api.services().then(setServices).catch(() => {}); }, []);
  if (!st?.room) return <Navigate to="/rooms" replace />;

  const n = nights(st.checkIn, st.checkOut);
  const roomTotal = st.room.price * n;
  const svcDetail = services.map((s) => ({ ...s, count: qty[s.id] || 0 }))
    .filter((s) => s.count > 0)
    .map((s) => ({ name: s.name, count: s.count, unitPrice: s.price, amount: s.price * s.count * (s.perDay ? n : 1) }));
  const svcTotal = svcDetail.reduce((a, s) => a + s.amount, 0);
  const total = roomTotal + svcTotal;

  const bump = (id, d) => setQty((q) => ({ ...q, [id]: Math.max(0, (q[id] || 0) + d) }));

  const submit = async () => {
    setErr("");
    if (!info.guestName || !info.guestPhone || !info.guestEmail || !info.guestAddress) return setErr("Vui lòng điền đầy đủ các trường bắt buộc (*).");
    setSaving(true);
    try {
      const rec = await pb.collection("bookings").create({
        code: genCode(), customer: user?.id || null,
        roomCode: st.room.code, roomTypeName: st.room.typeName,
        guestName: info.guestName, guestPhone: info.guestPhone, guestEmail: info.guestEmail,
        guestAddress: info.guestAddress, note: info.note, guests: Number(st.guests) || 1,
        checkIn: st.checkIn, checkOut: st.checkOut, nights: n,
        roomPrice: st.room.price, servicesTotal: svcTotal, servicesDetail: svcDetail,
        total, payMethod: pay, payStatus: pay === "transfer" ? "deposit" : "unpaid",
        status: "pending",
      });
      nav("/success/" + rec.id, { replace: true });
    } catch (e) { setErr("Đặt phòng thất bại. Vui lòng thử lại."); }
    finally { setSaving(false); }
  };

  return (
    <SiteLayout>
      <div className="max-w-[80rem] mx-auto px-5 py-10">
        <h1 className="font-display text-4xl font-extrabold text-center">Thông tin đặt phòng</h1>
        <div className="grid lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h3 className="font-display text-xl font-bold text-primary">Lựa chọn dịch vụ</h3>
              <div className="mt-3 space-y-3">
                {services.map((s) => (
                  <div key={s.id} className="flex items-center gap-4 bg-card border border-border rounded-xl p-3">
                    <div className="w-20 h-16 rounded-lg bg-cover bg-center bg-secondary" style={{ backgroundImage: `url(${s.image})` }} />
                    <div className="flex-1">
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-sm text-muted-foreground">Giá: {fmtVND(s.price)}/{s.unit}{s.perDay ? " (x số ngày)" : ""}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => bump(s.id, -1)} className="w-8 h-8 rounded-full border border-border flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                      <span className="w-6 text-center font-semibold">{qty[s.id] || 0}</span>
                      <button onClick={() => bump(s.id, 1)} className="w-8 h-8 rounded-full border border-border flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-display text-xl font-bold text-primary">Điền thông tin đặt phòng</h3>
              <div className="grid md:grid-cols-2 gap-4 mt-3">
                {[["guestName", "Họ và tên *"], ["guestPhone", "Số điện thoại *"], ["guestEmail", "Email *"], ["guestAddress", "Địa chỉ *"]].map(([k, l]) => (
                  <label key={k} className="text-sm font-semibold">{l}
                    <input value={info[k]} onChange={(e) => setInfo({ ...info, [k]: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary" /></label>
                ))}
                <label className="text-sm font-semibold md:col-span-2">Ghi chú
                  <textarea value={info.note} onChange={(e) => setInfo({ ...info, note: e.target.value })} className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary" rows={2} /></label>
              </div>
            </div>

            <div>
              <h3 className="font-display text-xl font-bold text-primary">Phương thức thanh toán</h3>
              <div className="mt-3 space-y-3">
                <button onClick={() => setPay("cash")} className={`w-full text-left p-3 rounded-xl border ${pay === "cash" ? "border-primary bg-primary/5" : "border-border"}`}>Thanh toán khi nhận phòng</button>
                <button onClick={() => setPay("transfer")} className={`w-full text-left p-3 rounded-xl border ${pay === "transfer" ? "border-primary bg-primary/5" : "border-border"}`}>Chuyển khoản giữ phòng</button>
              </div>
              {pay === "transfer" && (
                <div className="mt-3 bg-secondary rounded-xl p-4 text-sm space-y-1">
                  <p className="font-semibold text-primary">Thông tin chuyển khoản giữ phòng</p>
                  <p>Ngân hàng: <b>Vietcombank</b></p>
                  <p className="flex items-center gap-2">Số tài khoản: <b>0351 2000 3566</b>
                    <button onClick={() => navigator.clipboard?.writeText("035120003566")} className="text-primary"><Copy className="w-4 h-4" /></button></p>
                  <p>Chủ tài khoản: <b>NUI HOMESTAY</b></p>
                  <p>Số tiền giữ phòng: <b className="text-accent">{fmtVND(Math.round(total * 0.3))}</b> (30%)</p>
                  <p className="text-muted-foreground">Nội dung: <b>{info.guestPhone || "SĐT"} {st.room.code}</b></p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 h-fit sticky top-20">
            <h3 className="font-display text-xl font-bold text-center">Chi tiết đặt phòng</h3>
            <div className="mt-4 space-y-2 text-sm">
              <Row l="Ngày nhận" v={fmtDate(st.checkIn)} /><Row l="Ngày trả" v={fmtDate(st.checkOut)} />
              <Row l="Số người" v={st.guests} /><Row l="Tên phòng" v={st.room.code} />
              <Row l="Loại phòng" v={st.room.typeName} /><Row l="Số ngày" v={n} />
              <Row l="Giá" v={fmtVND(st.room.price)} /><Row l="Thành tiền" v={fmtVND(roomTotal)} />
              {svcDetail.length > 0 && <div className="pt-2 border-t border-border font-semibold">Dịch vụ</div>}
              {svcDetail.map((s) => <Row key={s.name} l={`${s.name} x${s.count}`} v={fmtVND(s.amount)} />)}
              <div className="pt-3 border-t border-border flex justify-between text-base">
                <b>Tổng thanh toán</b><b className="text-accent">{fmtVND(total)}</b>
              </div>
            </div>
            {err && <p className="text-destructive text-sm mt-3">{err}</p>}
            <button onClick={submit} disabled={saving} className="w-full mt-4 py-3 rounded-full bg-accent text-accent-foreground font-semibold hover:brightness-105 disabled:opacity-60">{saving ? "Đang xử lý..." : "Đặt phòng"}</button>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
const Row = ({ l, v }) => <div className="flex justify-between"><span className="text-muted-foreground">{l}</span><span className="font-medium">{v}</span></div>;
