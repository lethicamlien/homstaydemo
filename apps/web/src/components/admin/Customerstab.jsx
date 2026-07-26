import { Trash2 } from "lucide-react";

export default function CustomersTab({ customers, del }) {
  return (
    <div>
      <h2 className="font-display text-2xl font-bold mb-6">Danh sách khách hàng</h2>
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary">
            <tr>
              <th className="text-left p-3">Tên khách hàng</th>
              <th className="text-left p-3">Số điện thoại</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">CMND/CCCD</th>
              <th className="text-right p-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-t border-border hover:bg-secondary/30">
                <td className="p-3 font-semibold">{c.name || "Khách lẻ"}</td>
                <td className="p-3">{c.phone || "---"}</td>
                <td className="p-3">{c.email || "---"}</td>
                <td className="p-3">{c.idCard || "---"}</td>
                <td className="p-3 text-right">
                  <button onClick={() => del("customers", c.id)} className="text-rose-500 hover:opacity-80">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-6 text-muted-foreground">Chưa có thông tin khách hàng.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}