import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SiteLayout from "@/components/SiteLayout";
import { useAuth } from "@/lib/AuthContext";
import { Palmtree } from "lucide-react";

//useAuth(): Lấy các hàm login, signup, forgot đã viết ở file AuthContext sang đây để sử dụng.
//useNavigate(): Dùng để chuyển hướng trang (chuyển sang trang Admin /admin, trang Lễ tân /reception,
// hoặc Trang chủ / sau khi đăng nhập thành công).
export default function AuthPage() {
  const { login, signup, forgot } = useAuth();
  const nav = useNavigate();
  //tab: Theo dõi tab nào đang được mở ("login", "signup", hoặc "forgot").
  const [tab, setTab] = useState("login");
  //f: Trạng thái lưu trữ dữ liệu người dùng đang gõ vào các ô input (email, password, fullName, phone).
  const [f, setF] = useState({ email: "", password: "", fullName: "", phone: "" });
  //msg & err: Lưu thông báo thành công hoặc thông báo lỗi để hiển thị lên màn hình.
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");


  //Hàm validate() (Ràng buộc dữ liệu đầu vào):
  const validate = () => {
    // 1. Kiểm tra Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!f.email || !emailRegex.test(f.email)) {
      setErr("Vui lòng nhập đúng định dạng Email (ví dụ: example@gmail.com).");
      return false;
    }

    if (tab === "forgot") return true;

    // 2. Kiểm tra Mật khẩu
    if (!f.password || f.password.length < 8) {
      setErr("Mật khẩu phải có ít nhất 8 ký tự.");
      return false;
    }

    // 3. Ràng buộc riêng cho Đăng ký
    if (tab === "signup") {
      if (!f.fullName.trim()) {
        setErr("Vui lòng nhập Họ và tên.");
        return false;
      }

      // Kiểm tra Số điện thoại Việt Nam chuẩn (10 chữ số, bắt đầu bằng 0)
      const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
      if (!f.phone || !phoneRegex.test(f.phone)) {
        setErr("Số điện thoại không hợp lệ (Phải đúng 10 số).");
        return false;
      }
    }

    return true;
  };

  const submit = async (e) => {
    e.preventDefault();//Ngăn trang web bị reload lại mặc định của HTML Form.
    setErr("");
    setMsg("");

    // Validate ở client trước khi gửi request
    if (!validate()) return;//nếu có lỗi thì dừng lại và hiện thông báo đỏ ngay

    try {
      //Nếu là tab login $\rightarrow$ gọi login().
      if (tab === "login") {
        const a = await login(f.email, f.password);
        go(a.record);
        //Nếu là tab signup $\rightarrow$ gọi signup().
      } else if (tab === "signup") {
        const a = await signup(f);
        go(a.record);
      } else {
        await forgot(f.email);
        setMsg("Đã gửi email khôi phục mật khẩu (nếu email tồn tại).");
      }
    } catch (e2) {
      // Nhận thông báo lỗi trực tiếp từ AuthContext trả về
      setErr(e2.message || "Có lỗi xảy ra, vui lòng thử lại.");
    }
  };

  const go = (u) => nav(u?.role === "admin" ? "/admin" : u?.role === "receptionist" ? "/reception" : "/");

  return (
    <SiteLayout>
      <div className="max-w-md mx-auto px-5 py-16">
        <div className="flex items-center justify-center gap-2 font-display text-2xl font-extrabold text-primary mb-6">
          <Palmtree className="w-7 h-7 text-accent" />
          Núi Homestay
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          {/* Thanh chuyển đổi chỉ còn 2 tab: Đăng nhập & Đăng ký */}
          <div className="flex gap-2 mb-5">
            {[["login", "Đăng nhập"], ["signup", "Đăng ký"]].map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setTab(k);
                  setErr("");
                  setMsg("");
                }}
                className={`flex-1 py-2 rounded-full text-sm font-semibold transition-colors ${
                  tab === k ? "bg-primary text-white" : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            {tab === "signup" && (
              <>
                <div>
                  <input
                    required
                    placeholder="Họ và tên *"
                    value={f.fullName}
                    onChange={(e) => setF({ ...f, fullName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <input
                    required
                    placeholder="Số điện thoại (10 số) *"
                    value={f.phone}
                    maxLength={10}
                    onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, "") })}
                    className="w-full px-3 py-2 rounded-lg bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </>
            )}

            <div>
              <input
                required
                type="email"
                placeholder="Email *"
                value={f.email}
                onChange={(e) => setF({ ...f, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Hiển thị ô Mật khẩu nếu không phải chế độ Quên MK */}
            {tab !== "forgot" && (
              <div>
                <input
                  required
                  type="password"
                  placeholder="Mật khẩu (tối thiểu 8 ký tự) *"
                  value={f.password}
                  onChange={(e) => setF({ ...f, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />

                {/* Dòng chữ Quên mật khẩu nằm dưới ô mật khẩu khi ở tab Đăng nhập */}
                {tab === "login" && (
                  <div className="flex justify-end mt-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setTab("forgot");
                        setErr("");
                        setMsg("");
                      }}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors underline"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tiêu đề hỗ trợ nếu đang ở giao diện Quên mật khẩu */}
            {tab === "forgot" && (
              <p className="text-xs text-muted-foreground">
                Nhập email của bạn để nhận liên kết khôi phục mật khẩu.
              </p>
            )}

            {err && <p className="text-destructive text-sm font-medium bg-destructive/10 p-2 rounded-lg">{err}</p>}
            {msg && <p className="text-primary text-sm font-medium bg-primary/10 p-2 rounded-lg">{msg}</p>}

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-accent text-accent-foreground font-semibold hover:opacity-90 transition-opacity"
            >
              {tab === "login" ? "Đăng nhập" : tab === "signup" ? "Tạo tài khoản" : "Gửi email khôi phục"}
            </button>

            {/* Nút quay lại Đăng nhập nếu đang ở giao diện Quên mật khẩu */}
            {tab === "forgot" && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTab("login");
                    setErr("");
                    setMsg("");
                  }}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  ← Quay lại Đăng nhập
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </SiteLayout>
  );
}