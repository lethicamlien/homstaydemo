import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Palmtree, User, LogOut, History, LayoutDashboard, CalendarDays } from "lucide-react";
import Chatbot from "@/components/Chatbot";

function Header() {
  const { isAuthed, user, role, logout } = useAuth();
  const nav = useNavigate();
  const items = [
    { to: "/", label: "Trang chủ" },
    { to: "/rooms", label: "Phòng" },
    { to: "/gioi-thieu", label: "Giới thiệu" },
    { to: "/lien-he", label: "Liên hệ" },
  ];
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-border">
      <div className="max-w-[80rem] mx-auto px-5 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-extrabold text-primary">
          <Palmtree className="w-7 h-7 text-accent" /> Núi Homestay
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {items.map((i) => (
            <NavLink key={i.to} to={i.to} className={({ isActive }) =>
              `px-4 py-2 rounded-full text-sm font-medium transition ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>
              {i.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {(role === "admin") && <Link to="/admin" className="hidden sm:flex items-center gap-1 text-sm px-3 py-2 rounded-full bg-secondary"><LayoutDashboard className="w-4 h-4" />Quản lý</Link>}
          {(role === "receptionist") && <Link to="/reception" className="hidden sm:flex items-center gap-1 text-sm px-3 py-2 rounded-full bg-secondary"><CalendarDays className="w-4 h-4" />Lễ tân</Link>}
          {isAuthed ? (
            <div className="flex items-center gap-2">
              <Link to="/lich-su" className="flex items-center gap-1 text-sm px-3 py-2 rounded-full hover:bg-secondary"><History className="w-4 h-4" /><span className="hidden sm:inline">Lịch sử</span></Link>
              <button onClick={() => { logout(); nav("/"); }} className="flex items-center gap-1 text-sm px-3 py-2 rounded-full hover:bg-secondary text-destructive"><LogOut className="w-4 h-4" /></button>
            </div>
          ) : (
            <Link to="/auth" className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full bg-accent text-accent-foreground shadow-sm hover:brightness-105"><User className="w-4 h-4" />Đăng nhập</Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-20 bg-[hsl(200,40%,14%)] text-white/80">
      <div className="max-w-[80rem] mx-auto px-5 py-14 grid md:grid-cols-3 gap-10">
        <div>
          <div className="flex items-center gap-2 font-display text-xl font-extrabold text-white"><Palmtree className="w-6 h-6 text-accent" /> Núi Homestay</div>
          <p className="mt-3 text-sm leading-relaxed">Homestay yên bình giữa lòng cố đô Huế. Cách trung tâm 3,6km, không gian xanh mát và đầy đủ tiện nghi.</p>
        </div>
        <div>
          <div className="font-semibold text-white mb-3">Kết nối</div>
          <p className="text-sm">Facebook: Núi Homestay</p>
          <p className="text-sm">TikTok: Nui@123</p>
        </div>
        <div>
          <div className="font-semibold text-white mb-3">Thông tin liên hệ</div>
          <p className="text-sm">Điện thoại: 035 356 600</p>
          <p className="text-sm">Email: Nuihomstay@gmail.com</p>
          <p className="text-sm">Địa chỉ: TP. Huế</p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">© {new Date().getFullYear()} Núi Homestay. All rights reserved.</div>
    </footer>
  );
}

export default function SiteLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <Chatbot />
    </div>
  );
}
