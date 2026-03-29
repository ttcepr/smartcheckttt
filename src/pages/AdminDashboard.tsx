import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { 
  Building2, 
  Users, 
  Clock, 
  Settings, 
  Plus, 
  Trash2, 
  Edit2, 
  MapPin,
  Wifi,
  ChevronRight,
  LayoutDashboard
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../lib/utils";

interface AdminDashboardProps {
  userData: any;
}

export default function AdminDashboard({ userData }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("employees");
  const [employees, setEmployees] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userData?.companyId) {
      fetchCompanyData();
      fetchEmployees();
    }
  }, [userData]);

  const fetchCompanyData = async () => {
    const docRef = doc(db, "companies", userData.companyId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      setCompany({ id: snap.id, ...snap.data() });
    }
  };

  const fetchEmployees = async () => {
    const q = query(collection(db, "users"), where("companyId", "==", userData.companyId));
    const snap = await getDocs(q);
    setEmployees(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-6 space-y-8">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <Building2 size={18} />
          </div>
          <span className="font-bold text-lg">Quản trị</span>
        </div>

        <nav className="space-y-1">
          <SidebarItem 
            icon={<Users size={20} />} 
            label="Nhân viên" 
            active={activeTab === "employees"} 
            onClick={() => setActiveTab("employees")} 
          />
          <SidebarItem 
            icon={<Clock size={20} />} 
            label="Ca làm việc" 
            active={activeTab === "shifts"} 
            onClick={() => setActiveTab("shifts")} 
          />
          <SidebarItem 
            icon={<MapPin size={20} />} 
            label="Vị trí & WiFi" 
            active={activeTab === "settings"} 
            onClick={() => setActiveTab("settings")} 
          />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {activeTab === "employees" ? "Danh sách nhân sự" : 
               activeTab === "shifts" ? "Quản lý ca làm việc" : "Cấu hình chi nhánh"}
            </h1>
            <p className="text-slate-500 text-sm">{company?.name || "Đang tải..."}</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
            <Plus size={18} />
            Thêm mới
          </button>
        </header>

        {activeTab === "employees" && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-4">Nhân viên</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Vai trò</th>
                  <th className="px-6 py-4">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-700">{emp.displayName}</td>
                    <td className="px-6 py-4 text-slate-600">{emp.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase">
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Edit2 size={16} /></button>
                      <button className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <MapPin size={18} className="text-blue-600" />
                Vị trí GPS
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Vĩ độ</label>
                  <input type="number" defaultValue={company?.lat} className="w-full px-4 py-2 rounded-lg border border-slate-200" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Kinh độ</label>
                  <input type="number" defaultValue={company?.lng} className="w-full px-4 py-2 rounded-lg border border-slate-200" />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Bán kính cho phép (mét)</label>
                  <input type="number" defaultValue={company?.radius} className="w-full px-4 py-2 rounded-lg border border-slate-200" />
                </div>
              </div>
              <button className="w-full py-2 bg-slate-900 text-white rounded-lg font-medium">Lưu vị trí</button>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Wifi size={18} className="text-blue-600" />
                WiFi văn phòng
              </h3>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Tên WiFi (SSID)</label>
                <input type="text" defaultValue={company?.wifiSSID} className="w-full px-4 py-2 rounded-lg border border-slate-200" placeholder="VD: SmartCheck_Office" />
              </div>
              <button className="w-full py-2 bg-slate-900 text-white rounded-lg font-medium">Lưu WiFi</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
        active ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
