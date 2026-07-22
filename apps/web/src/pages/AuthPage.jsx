import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SiteLayout from "@/components/SiteLayout";
import { useAuth } from "@/lib/AuthContext";
import { Palmtree } from "lucide-react";

export default function AuthPage() {
  const { login, signup, forgot } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState("login");
  const [f, setF] = useState({ email: "", password: "", fullName: "", phone: "" });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault(); setErr(""); setMsg("");
    try {
      if (tab === "login") { const a = await login(f.email, f.password); go(a.record); }
      else if (tab === "signup") { const a = await signup(f); go(a.record); }
      else { await forgot(f.email); setMsg("Đã gửi email khôi phục mật khẩu (nếu email tồn tại)."); }
    } catch (e2) { setErr("Thông tin không chính xác. Vui lòng thử lại."); }
  };
  const go = (u) => nav(u?.role === "admin" ? "/admin" : u?.role === "receptionist" ? "/reception" : "/");

  return (
    <SiteLayout>
      <div className="max-w-md mx-auto px-5 py-16">
        <div className="flex items-center justify-center gap-2 font-display text-2xl font-extrabold text-primary mb-6"><Palmtree className="w-7 h-7 text-accent" />Núi Homestay</div>
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex gap-2 mb-5">
            {[["login", "Đăng nhập"], ["signup", "Đăng ký"], ["forgot", "Quên MK"]].map(([k, l]) => (
              <button key={k} onClick={() => { setTab(k); setErr(""); setMsg(""); }} className={`flex-1 py-2 rounded-full text-sm font-semibold ${tab === k ? "bg-primary text-white" : "bg-secondary"}`}>{l}</button>
            ))}
          </div>
          <form onSubmit={submit} className="space-y-3">
            {tab === "signup" && <>
              <input required placeholder="Họ và tên" value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-secondary" />
              <input placeholder="Số điện thoại" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-secondary" />
            </>}
            <input required type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-secondary" />
            {tab !== "forgot" && <input required type="password" placeholder="Mật khẩu (tối thiểu 8 ký tự)" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-secondary" />}
            {err && <p className="text-destructive text-sm">{err}</p>}
            {msg && <p className="text-primary text-sm">{msg}</p>}
            <button className="w-full py-3 rounded-full bg-accent text-accent-foreground font-semibold">{tab === "login" ? "Đăng nhập" : tab === "signup" ? "Tạo tài khoản" : "Gửi email"}</button>
          </form>
        </div>
      </div>
    </SiteLayout>
  );
}
