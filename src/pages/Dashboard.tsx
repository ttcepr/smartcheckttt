import { cn } from "../lib/utils";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
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
  const navigate = useNavigate();

  useEffect(() => {
    if (!userData?.uid) return;

    const q = query(
      collection(db, "attendance"),
      where("userId", "==", userData.uid),
      orderBy("date", "desc"),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAttendances(data);
      
      // Calculate stats (simplified)
      setStats(prev => ({
        ...prev,
        workDays: data.length,
        lateCount: data.filter((a: any) => a.status === 'late').length
      }));
    });

    return () => unsubscribe();
  }, [userData]);

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
                <div key={item.id} className="grid grid-cols-5 px-4 py-4 items-center text-sm">
                  <span className="font-medium text-slate-700">{format(new Date(item.date), "dd/MM")}</span>
                  <span className="text-slate-600">{item.checkInTime ? format(new Date(item.checkInTime), "HH:mm") : "—"}</span>
                  <span className="text-slate-600">{item.checkOutTime ? format(new Date(item.checkOutTime), "HH:mm") : "—"}</span>
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
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 flex justify-between items-center z-20">
        <NavItem icon={<Calendar size={22} />} label="Báo cáo" active />
        <NavItem icon={<Clock size={22} />} label="Đơn từ" onClick={() => toast.info("Tính năng đang phát triển")} />
        
        {/* Floating Check-in Button */}
        <div className="relative -top-6">
          <button 
            onClick={() => navigate("/attendance")}
            className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-blue-200 border-4 border-white transform transition-transform active:scale-95"
          >
            <Clock size={32} />
          </button>
        </div>

        <NavItem icon={<UserIcon size={22} />} label="Nhân sự" onClick={() => toast.info("Tính năng đang phát triển")} />
        <NavItem icon={<Settings size={22} />} label="Thêm" onClick={() => navigate("/profile")} />
      </nav>
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
