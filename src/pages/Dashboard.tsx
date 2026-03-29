import { cn } from "../lib/utils";
import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy, limit, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { motion } from "motion/react";
import { 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  User as UserIcon, 
  Settings, 
  LogOut,
  ChevronRight,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../lib/firebase";
import { toast } from "sonner";

interface DashboardProps {
  userData: any;
}

export default function Dashboard({ userData }: DashboardProps) {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [stats, setStats] = useState({
    workDays: 0,
    lateCount: 0,
    missingOut: 0,
    absent: 24 // Mocking for now based on UI
  });
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    type: "leave",
    reason: "",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd")
  });
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [colleagues, setColleagues] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("report"); // report, requests, or personnel
  const navigate = useNavigate();

  useEffect(() => {
    if (!userData?.uid || !userData?.companyId) return;

    // Attendance subscription
    const qAtt = query(
      collection(db, "attendance"),
      where("userId", "==", userData.uid),
      orderBy("checkInTime", "desc"),
      limit(50)
    );

    const unsubAtt = onSnapshot(qAtt, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const grouped: any = {};
      data.forEach((record: any) => {
        const date = record.date;
        if (!grouped[date]) {
          grouped[date] = { date, checkIn: null, checkOut: null, status: 'on_time' };
        }
        if (record.type === 'checkin') {
          grouped[date].checkIn = record.checkInTime;
          grouped[date].status = record.status;
        } else if (record.type === 'checkout') {
          grouped[date].checkOut = record.checkInTime;
        }
      });

      const sortedGrouped = Object.values(grouped).sort((a: any, b: any) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setAttendances(sortedGrouped);
      
      const workDays = Object.keys(grouped).length;
      const lateCount = Object.values(grouped).filter((a: any) => a.status === 'late').length;
      const missingOut = Object.values(grouped).filter((a: any) => !a.checkOut).length;

      setStats({
        workDays,
        lateCount,
        missingOut,
        absent: 24 - workDays
      });
    });

    // Requests subscription
    const qReq = query(
      collection(db, "requests"),
      where("userId", "==", userData.uid),
      orderBy("createdAt", "desc")
    );

    const unsubReq = onSnapshot(qReq, (snapshot) => {
      setMyRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Colleagues subscription
    const qCol = query(
      collection(db, "users"),
      where("companyId", "==", userData.companyId)
    );

    const unsubCol = onSnapshot(qCol, (snapshot) => {
      setColleagues(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubAtt();
      unsubReq();
      unsubCol();
    };
  }, [userData]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "requests"), {
        ...requestForm,
        userId: userData.uid,
        companyId: userData.companyId,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      toast.success("Đã gửi đơn từ thành công!");
      setShowRequestModal(false);
      setRequestForm({
        type: "leave",
        reason: "",
        startDate: format(new Date(), "yyyy-MM-dd"),
        endDate: format(new Date(), "yyyy-MM-dd")
      });
    } catch (err: any) {
      toast.error("Lỗi: " + err.message);
    }
  };

  const handleLogout = () => {
    auth.signOut();
    navigate("/login");
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <CheckCircle2 size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800">SmartCheck</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/profile")} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
            <UserIcon size={20} />
          </button>
        </div>
      </header>

      <main className="p-6 space-y-8 max-w-2xl mx-auto">
        {activeTab === "report" ? (
          <>
            {/* Welcome Section */}
            <section className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900">Báo cáo chấm công</h2>
              <p className="text-slate-500">Tháng {format(new Date(), "M/yyyy")}</p>
            </section>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="NGÀY CÔNG" value={stats.workDays} color="text-slate-900" />
              <StatCard label="ĐI MUỘN" value={stats.lateCount} unit="lần" color="text-emerald-500" />
              <StatCard label="THIẾU RA CA" value={stats.missingOut} color="text-emerald-500" />
              <StatCard label="VẮNG" value={stats.absent} unit="ngày" color="text-rose-500" />
              <StatCard label="TĂNG CA" value="—" className="col-span-2" />
            </div>

            {/* Attendance Table */}
            <section className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <div className="grid grid-cols-5 bg-slate-50 px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <span>Ngày</span>
                <span>Vào ca</span>
                <span>Ra ca</span>
                <span className="col-span-2">Trạng thái</span>
              </div>
              
              <div className="divide-y divide-slate-50">
                {attendances.length > 0 ? (
                  attendances.map((item) => (
                    <div key={item.date} className="grid grid-cols-5 px-4 py-4 items-center text-sm">
                      <span className="font-medium text-slate-700">{format(new Date(item.date), "dd/MM")}</span>
                      <span className="text-slate-600">{item.checkIn ? format(new Date(item.checkIn), "HH:mm") : "—"}</span>
                      <span className="text-slate-600">{item.checkOut ? format(new Date(item.checkOut), "HH:mm") : "—"}</span>
                      <div className="col-span-2 flex items-center justify-between">
                        <span className={cn(
                          "px-2 py-1 rounded-md text-[10px] font-bold uppercase",
                          item.status === 'on_time' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                        )}>
                          {item.status === 'on_time' ? "Đúng giờ" : "Đi muộn"}
                        </span>
                        <ChevronRight size={16} className="text-slate-300" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-400 text-sm italic">
                    Chưa có dữ liệu
                  </div>
                )}
              </div>
            </section>
          </>
        ) : activeTab === "requests" ? (
          <>
            {/* Requests Section */}
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">Đơn từ của tôi</h2>
                <button 
                  onClick={() => setShowRequestModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-100"
                >
                  <Plus size={18} />
                  TẠO ĐƠN
                </button>
              </div>

              <div className="space-y-4">
                {myRequests.length > 0 ? (
                  myRequests.map((req) => (
                    <div key={req.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-[10px] font-bold uppercase">
                            {req.type === 'leave' ? 'Nghỉ phép' : req.type === 'overtime' ? 'Tăng ca' : 'Đi muộn/Về sớm'}
                          </span>
                          <h3 className="font-bold text-slate-800">{req.reason}</h3>
                        </div>
                        <span className={cn(
                          "px-2 py-1 rounded-md text-[10px] font-bold uppercase",
                          req.status === 'approved' ? "bg-emerald-50 text-emerald-600" : 
                          req.status === 'rejected' ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                        )}>
                          {req.status === 'approved' ? 'Đã duyệt' : req.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>{req.startDate} {req.endDate !== req.startDate && `đến ${req.endDate}`}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-400 text-sm italic bg-white rounded-2xl border border-dashed border-slate-200">
                    Chưa có đơn từ nào
                  </div>
                )}
              </div>
            </section>
          </>
        ) : (
          <>
            {/* Personnel Section */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900">Danh sách nhân sự</h2>
              <div className="grid grid-cols-1 gap-4">
                {colleagues.map((col) => (
                  <div key={col.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                      <UserIcon size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800">{col.displayName}</h3>
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{col.role === 'company_admin' ? 'Quản trị viên' : 'Nhân viên'}</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 flex justify-between items-center z-20">
        <NavItem icon={<Calendar size={22} />} label="Báo cáo" active={activeTab === "report"} onClick={() => setActiveTab("report")} />
        <NavItem icon={<Clock size={22} />} label="Đơn từ" active={activeTab === "requests"} onClick={() => setActiveTab("requests")} />
        
        {/* Floating Check-in Button */}
        <div className="relative -top-6">
          <button 
            onClick={() => navigate("/attendance")}
            className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-blue-200 border-4 border-white transform transition-transform active:scale-95"
          >
            <Clock size={32} />
          </button>
        </div>

        <NavItem icon={<UserIcon size={22} />} label="Nhân sự" active={activeTab === "personnel"} onClick={() => setActiveTab("personnel")} />
        <NavItem icon={<Settings size={22} />} label="Thêm" onClick={() => navigate("/profile")} />
      </nav>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-md rounded-3xl p-8 space-y-6 shadow-2xl"
          >
            <h2 className="text-2xl font-bold text-slate-900">Tạo đơn từ mới</h2>
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Loại đơn</label>
                <select 
                  value={requestForm.type}
                  onChange={e => setRequestForm({...requestForm, type: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                >
                  <option value="leave">Nghỉ phép</option>
                  <option value="overtime">Tăng ca</option>
                  <option value="late_early">Đi muộn/Về sớm</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Từ ngày</label>
                  <input 
                    type="date"
                    required
                    value={requestForm.startDate}
                    onChange={e => setRequestForm({...requestForm, startDate: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Đến ngày</label>
                  <input 
                    type="date"
                    required
                    value={requestForm.endDate}
                    onChange={e => setRequestForm({...requestForm, endDate: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Lý do</label>
                <textarea 
                  required
                  value={requestForm.reason}
                  onChange={e => setRequestForm({...requestForm, reason: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 h-24 resize-none"
                  placeholder="Nhập lý do chi tiết..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl"
                >
                  HỦY
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200"
                >
                  GỬI ĐƠN
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, unit = "", color = "text-slate-900", className = "" }: any) {
  return (
    <div className={cn("bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-1", className)}>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className={cn("text-3xl font-bold", color)}>{value}</span>
        {unit && <span className={cn("text-xs font-bold", color)}>{unit}</span>}
      </div>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-colors",
        active ? "text-blue-600" : "text-slate-400"
      )}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
    </button>
  );
}
