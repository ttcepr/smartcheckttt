import { cn } from "../lib/utils";
import { useState } from "react";
import { auth } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import { 
  User as UserIcon, 
  Mail, 
  Building2, 
  Shield, 
  LogOut, 
  ChevronLeft,
  Camera,
  Key
} from "lucide-react";
import { toast } from "sonner";

interface ProfilePageProps {
  userData: any;
}

export default function ProfilePage({ userData }: ProfilePageProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/login");
    } catch (e) {
      toast.error("Lỗi khi đăng xuất");
    }
  };

  if (!userData) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white px-6 py-4 flex items-center gap-4 border-b border-slate-100">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-slate-800">Cá nhân</h1>
      </header>

      <main className="flex-1 p-6 space-y-6 max-w-md mx-auto w-full">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 border-4 border-white shadow-lg">
              <UserIcon size={48} />
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm">
              <Camera size={16} />
            </button>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{userData.name}</h2>
            <p className="text-slate-500 font-medium">{userData.role === 'super_admin' ? 'Quản trị hệ thống' : userData.role === 'admin' ? 'Quản lý chi nhánh' : 'Nhân viên'}</p>
          </div>
        </div>

        {/* Info List */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <InfoItem icon={<Mail size={20} />} label="Email" value={userData.email} />
          <InfoItem icon={<Building2 size={20} />} label="Chi nhánh" value={userData.companyId || "Hệ thống"} />
          <InfoItem icon={<Shield size={20} />} label="Quyền hạn" value={userData.role} />
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button 
            onClick={() => navigate("/change-password")}
            className="w-full bg-white text-slate-700 font-bold py-4 rounded-2xl border border-slate-200 flex items-center justify-center gap-3 transition-colors active:bg-slate-50"
          >
            <Key size={20} className="text-slate-400" />
            Đổi mật khẩu
          </button>
          <button 
            onClick={handleLogout}
            className="w-full bg-rose-50 text-rose-600 font-bold py-4 rounded-2xl border border-rose-100 flex items-center justify-center gap-3 transition-colors active:bg-rose-100"
          >
            <LogOut size={20} />
            Đăng xuất
          </button>
        </div>
      </main>

      <footer className="p-8 text-center">
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">SmartCheck v1.0.0</p>
      </footer>
    </div>
  );
}

function InfoItem({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-50 last:border-0">
      <div className="text-slate-400">{icon}</div>
      <div className="flex-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-bold text-slate-700">{value}</p>
      </div>
    </div>
  );
}
