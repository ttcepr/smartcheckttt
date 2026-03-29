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
  const [shifts, setShifts] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [employeeForm, setEmployeeForm] = useState({ displayName: "", email: "", role: "employee" });

  const [showShiftModal, setShowShiftModal] = useState(false);
  const [editingShift, setEditingShift] = useState<any>(null);
  const [shiftForm, setShiftForm] = useState({ name: "", startTime: "08:00", endTime: "17:00" });

  useEffect(() => {
    if (userData?.companyId) {
      fetchCompanyData();
      fetchEmployees();
      fetchShifts();
      fetchAttendance();
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

  const fetchShifts = async () => {
    const q = query(collection(db, "shifts"), where("companyId", "==", userData.companyId));
    const snap = await getDocs(q);
    setShifts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchAttendance = async () => {
    const q = query(collection(db, "attendance"), where("companyId", "==", userData.companyId));
    const snap = await getDocs(q);
    const attData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
    // Sort by time descending
    attData.sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime());
    setAttendance(attData);
  };

  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await updateDoc(doc(db, "users", editingEmployee.id), {
          ...employeeForm,
          updatedAt: new Date().toISOString()
        });
        toast.success("Đã cập nhật nhân viên!");
      } else {
        await addDoc(collection(db, "users"), {
          ...employeeForm,
          companyId: userData.companyId,
          mustChangePassword: true,
          createdAt: new Date().toISOString()
        });
        toast.success("Đã thêm nhân viên mới (MK mặc định: 123)!");
      }
      setShowEmployeeModal(false);
      setEditingEmployee(null);
      setEmployeeForm({ displayName: "", email: "", role: "employee" });
      fetchEmployees();
    } catch (err: any) {
      toast.error("Lỗi: " + err.message);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!window.confirm("Xóa nhân viên này?")) return;
    try {
      await deleteDoc(doc(db, "users", id));
      toast.success("Đã xóa nhân viên!");
      fetchEmployees();
    } catch (err: any) {
      toast.error("Lỗi: " + err.message);
    }
  };

  const handleShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingShift) {
        await updateDoc(doc(db, "shifts", editingShift.id), {
          ...shiftForm,
          updatedAt: new Date().toISOString()
        });
        toast.success("Đã cập nhật ca làm!");
      } else {
        await addDoc(collection(db, "shifts"), {
          ...shiftForm,
          companyId: userData.companyId,
          createdAt: new Date().toISOString()
        });
        toast.success("Đã thêm ca làm mới!");
      }
      setShowShiftModal(false);
      setEditingShift(null);
      setShiftForm({ name: "", startTime: "08:00", endTime: "17:00" });
      fetchShifts();
    } catch (err: any) {
      toast.error("Lỗi: " + err.message);
    }
  };

  const handleDeleteShift = async (id: string) => {
    if (!window.confirm("Xóa ca làm này?")) return;
    try {
      await deleteDoc(doc(db, "shifts", id));
      toast.success("Đã xóa ca làm!");
      fetchShifts();
    } catch (err: any) {
      toast.error("Lỗi: " + err.message);
    }
  };

  const handleSaveSettings = async (type: 'gps' | 'wifi') => {
    try {
      const updates: any = {};
      if (type === 'gps') {
        updates.lat = company.lat;
        updates.lng = company.lng;
        updates.radius = company.radius;
      } else {
        updates.wifiSSID = company.wifiSSID;
      }
      await updateDoc(doc(db, "companies", company.id), updates);
      toast.success("Đã lưu cấu hình!");
    } catch (err: any) {
      toast.error("Lỗi: " + err.message);
    }
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
            icon={<LayoutDashboard size={20} />} 
            label="Lịch sử chấm công" 
            active={activeTab === "attendance"} 
            onClick={() => setActiveTab("attendance")} 
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
               activeTab === "shifts" ? "Quản lý ca làm việc" : 
               activeTab === "attendance" ? "Lịch sử chấm công" : "Cấu hình chi nhánh"}
            </h1>
            <p className="text-slate-500 text-sm">{company?.name || "Đang tải..."}</p>
          </div>
          {(activeTab === "employees" || activeTab === "shifts") && (
            <button 
              onClick={() => {
                if (activeTab === "employees") {
                  setEditingEmployee(null);
                  setEmployeeForm({ displayName: "", email: "", role: "employee" });
                  setShowEmployeeModal(true);
                } else {
                  setEditingShift(null);
                  setShiftForm({ name: "", startTime: "08:00", endTime: "17:00" });
                  setShowShiftModal(true);
                }
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
            >
              <Plus size={18} />
              Thêm mới
            </button>
          )}
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
                      <button 
                        onClick={() => {
                          setEditingEmployee(emp);
                          setEmployeeForm({ displayName: emp.displayName, email: emp.email, role: emp.role });
                          setShowEmployeeModal(true);
                        }}
                        className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteEmployee(emp.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "shifts" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shifts.map(shift => (
              <div key={shift.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                    <Clock size={20} />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setEditingShift(shift);
                        setShiftForm({ name: shift.name, startTime: shift.startTime, endTime: shift.endTime });
                        setShowShiftModal(true);
                      }}
                      className="p-1 text-slate-400 hover:text-blue-600"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteShift(shift.id)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-slate-900">{shift.name}</h3>
                <p className="text-sm text-slate-500">{shift.startTime} - {shift.endTime}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "attendance" && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                  <th className="px-6 py-4">Nhân viên</th>
                  <th className="px-6 py-4">Thời gian</th>
                  <th className="px-6 py-4">Loại</th>
                  <th className="px-6 py-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendance.map(att => {
                  const emp = employees.find(e => e.uid === att.userId);
                  return (
                    <tr key={att.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-700">{emp?.displayName || "Ẩn danh"}</td>
                      <td className="px-6 py-4 text-slate-600">
                        {new Date(att.checkInTime).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-md text-[10px] font-bold uppercase",
                          att.type === "checkout" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                        )}>
                          {att.type === "checkout" ? "Check-out" : "Check-in"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-md text-[10px] font-bold uppercase",
                          att.status === "on_time" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                        )}>
                          {att.status === "on_time" ? "Đúng giờ" : "Muộn"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
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
                  <input 
                    type="number" step="any"
                    value={company?.lat} 
                    onChange={e => setCompany({...company, lat: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Kinh độ</label>
                  <input 
                    type="number" step="any"
                    value={company?.lng} 
                    onChange={e => setCompany({...company, lng: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200" 
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Bán kính cho phép (mét)</label>
                  <input 
                    type="number" 
                    value={company?.radius} 
                    onChange={e => setCompany({...company, radius: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200" 
                  />
                </div>
              </div>
              <button 
                onClick={() => handleSaveSettings('gps')}
                className="w-full py-2 bg-slate-900 text-white rounded-lg font-medium"
              >
                Lưu vị trí
              </button>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Wifi size={18} className="text-blue-600" />
                WiFi văn phòng
              </h3>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Tên WiFi (SSID)</label>
                <input 
                  type="text" 
                  value={company?.wifiSSID || ""} 
                  onChange={e => setCompany({...company, wifiSSID: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200" 
                  placeholder="VD: SmartCheck_Office" 
                />
              </div>
              <button 
                onClick={() => handleSaveSettings('wifi')}
                className="w-full py-2 bg-slate-900 text-white rounded-lg font-medium"
              >
                Lưu WiFi
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Employee Modal */}
      {showEmployeeModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 space-y-6 shadow-2xl">
            <h2 className="text-2xl font-bold">{editingEmployee ? "Sửa nhân viên" : "Thêm nhân viên"}</h2>
            <form onSubmit={handleEmployeeSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Họ tên</label>
                <input 
                  required
                  type="text" 
                  value={employeeForm.displayName}
                  onChange={e => setEmployeeForm({...employeeForm, displayName: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Email</label>
                <input 
                  required
                  type="email" 
                  value={employeeForm.email}
                  onChange={e => setEmployeeForm({...employeeForm, email: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Vai trò</label>
                <select 
                  value={employeeForm.role}
                  onChange={e => setEmployeeForm({...employeeForm, role: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="employee">Nhân viên</option>
                  <option value="company_admin">Quản trị viên</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowEmployeeModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl">HỦY</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200">LƯU</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shift Modal */}
      {showShiftModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 space-y-6 shadow-2xl">
            <h2 className="text-2xl font-bold">{editingShift ? "Sửa ca làm" : "Thêm ca làm"}</h2>
            <form onSubmit={handleShiftSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Tên ca</label>
                <input 
                  required
                  type="text" 
                  value={shiftForm.name}
                  onChange={e => setShiftForm({...shiftForm, name: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="VD: Ca sáng"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Bắt đầu</label>
                  <input 
                    required
                    type="time" 
                    value={shiftForm.startTime}
                    onChange={e => setShiftForm({...shiftForm, startTime: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Kết thúc</label>
                  <input 
                    required
                    type="time" 
                    value={shiftForm.endTime}
                    onChange={e => setShiftForm({...shiftForm, endTime: e.target.value})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowShiftModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl">HỦY</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200">LƯU</button>
              </div>
            </form>
          </div>
        </div>
      )}
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
