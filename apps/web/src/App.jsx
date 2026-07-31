import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Palmtree, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminHeader({ title = "Núi Homestay", children }) {
  const { logout } = useAuth();
  const nav = useNavigate();

  const handleLogout = () => {
    logout();
    nav("/auth", { replace: true });
  };

  return (
    <header className="bg-primary text-white px-5 h-14 flex items-center justify-between shadow-md sticky top-0 z-50">
      {/* Góc bên trái: Logo/Tiêu đề + Thẻ Tabs / Nút chức năng tuỳ chỉnh */}
      <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
        <span className="font-display font-extrabold flex items-center gap-1.5 whitespace-nowrap text-base">
          <Palmtree className="w-5 h-5 text-amber-400" /> {title}
        </span>
        {children}
      </div>

      {/* Góc bên phải: Nút Đăng xuất đồng bộ */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          title="Đăng xuất"
          className="text-white/90 hover:text-white hover:bg-white/10 gap-1.5 text-xs font-semibold"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất</span>
        </Button>
      </div>
    </header>
  );
}